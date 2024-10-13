import os
import io
import uuid  # For generating unique file names
import traceback  # Importing traceback module
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from face_recognition_face_recognition import FaceRecognitionFaceRecognition
from face_recognition_interface import FaceRecognitionInterface
from PIL import Image, ExifTags
import face_recognition
import logging
# Configure logging
logging.basicConfig(
    level=logging.INFO,  # Set the logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    format='%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s',  # Define the log message format
    handlers=[
        logging.StreamHandler()  # Log messages will be output to the console
    ]
)

# Create a logger instance
logger = logging.getLogger(__name__)


app = Flask(__name__)
# Allow all origins for development purposes
CORS(app, resources={r"/*": {"origins": "*"}})


SUPABASE_URL = 'https://mbkrvutzguuzqqnocgkp.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ia3J2dXR6Z3V1enFxbm9jZ2twIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODgyMDk4MiwiZXhwIjoyMDQ0Mzk2OTgyfQ.xbxaEgOkvH8PR0zi7E6o1xYrDlRT0dddr_849ATZESc'
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
print(f"Supabase client initialized: {supabase is not None}")  # Optional: For debugging



# Directories
KNOWN_FACES_DIR = 'known_faces'
UPLOAD_DIR = 'uploaded_images'

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize face recognition
face_recognition_module: FaceRecognitionInterface = FaceRecognitionFaceRecognition()
face_recognition_module.initialize()

# Load known faces
def load_known_faces():
    known_faces = []
    for filename in os.listdir(KNOWN_FACES_DIR):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            user_id = os.path.splitext(filename)[0]  # Assuming filename is user_id.jpg
            image_path = os.path.join(KNOWN_FACES_DIR, filename)
            known_faces.append((user_id, image_path))
    face_recognition_module.encode_known_faces(known_faces)
    print(f"Loaded {len(known_faces)} known faces.")

load_known_faces()


def compress_image(image_path, max_size=(800, 800)):
    """
    Compresses the image to the specified max size while maintaining aspect ratio.
    """
    try:
        with Image.open(image_path) as img:
            # Use Resampling.LANCZOS instead of Image.ANTIALIAS
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            img.save(image_path, optimize=True, quality=85)
            print(f"Compressed image saved at {image_path}.")
    except AttributeError:
        # Fallback for older Pillow versions
        with Image.open(image_path) as img:
            img.thumbnail(max_size, Image.ANTIALIAS)
            img.save(image_path, optimize=True, quality=85)
            print(f"Compressed image saved at {image_path}.")
    except Exception as e:
        print(f"Failed to compress image {image_path}: {e}")


def crop_faces(image_path, recognized_ids):
    try:
        # Use the extended FaceRecognitionFaceRecognition methods
        image = face_recognition_module.load_image_file(image_path)
        face_locations = face_recognition_module.get_face_locations(image)

        if len(face_locations) != 2:
            raise ValueError("Expected exactly two faces for cropping.")

        avatars = []
        for idx, (top, right, bottom, left) in enumerate(face_locations):
            # Crop the face using PIL
            face_image = Image.open(image_path).crop((left, top, right, bottom))
            avatar_io = io.BytesIO()
            face_image = face_image.resize((256, 256))  # Resize to standard avatar size
            face_image.save(avatar_io, format='JPEG', quality=85)
            avatar_io.seek(0)
            avatars.append((recognized_ids[idx], avatar_io.read()))

        print("Cropped and resized avatar images.")
        return avatars
    except Exception as e:
        print(f"Failed to crop faces: {e}")
        raise






def correct_image_orientation(image_path):
    """
    Opens an image and corrects its orientation based on EXIF data.

    Args:
        image_path (str): The file path to the image.

    Returns:
        str: The file path to the correctly oriented image.
    """
    try:
        image = Image.open(image_path)

        # Map EXIF orientation values to rotation degrees
        exif_orientation_tag = None
        for tag, value in ExifTags.TAGS.items():
            if value == 'Orientation':
                exif_orientation_tag = tag
                break

        if exif_orientation_tag is not None and hasattr(image, '_getexif'):
            exif = image._getexif()
            if exif is not None:
                orientation = exif.get(exif_orientation_tag, None)

                if orientation == 1:
                    # Normal orientation
                    pass
                elif orientation == 2:
                    # Mirrored left to right
                    image = image.transpose(Image.FLIP_LEFT_RIGHT)
                elif orientation == 3:
                    # Rotated 180 degrees
                    image = image.rotate(180, expand=True)
                elif orientation == 4:
                    # Mirrored top to bottom
                    image = image.transpose(Image.FLIP_TOP_BOTTOM)
                elif orientation == 5:
                    # Mirrored along top-left diagonal
                    image = image.transpose(Image.FLIP_LEFT_RIGHT).rotate(270, expand=True)
                elif orientation == 6:
                    # Rotated 270 degrees
                    image = image.rotate(270, expand=True)
                elif orientation == 7:
                    # Mirrored along top-right diagonal
                    image = image.transpose(Image.FLIP_LEFT_RIGHT).rotate(90, expand=True)
                elif orientation == 8:
                    # Rotated 90 degrees
                    image = image.rotate(90, expand=True)

                # Save the corrected image, overwriting the original
                image.save(image_path)
                print(f"Image orientation corrected for {image_path}.")

    except Exception as e:
        print(f"Failed to correct image orientation for {image_path}: {e}")
    



@app.route('/upload', methods=['POST'])
def upload_image():
    try:
        print("Received /upload request.")

        if 'image' not in request.files:
            print("No image part in the request.")
            return jsonify({"error": "No image uploaded."}), 400

        file = request.files['image']
        if file.filename == '':
            print("No selected file in the request.")
            return jsonify({"error": "No selected file."}), 400

        # Save the uploaded image
        image_path = os.path.join(UPLOAD_DIR, file.filename)
        file.save(image_path)
        print(f"Saved uploaded image to {image_path}.")

        # Correct the image orientation based on EXIF data
        correct_image_orientation(image_path)
        

        # Recognize faces
        recognized_ids = face_recognition_module.recognize_faces(image_path)
        print('Face recognition completed.')
        print(f'Detected {len(recognized_ids)} faces.')

        # Validate that exactly two faces are detected
        if len(recognized_ids) != 2:
            print(f"Incorrect number of faces detected: {len(recognized_ids)}.")
            return jsonify({
                "error": "Exactly two faces must be in the photo.",
                "detected_faces": len(recognized_ids)
            }), 400

        # Return the recognized IDs
        print(f"Recognized IDs: {recognized_ids}.")
        return jsonify({"recognized_ids": recognized_ids}), 200

    except Exception as e:
        print(f"Exception during /upload: {e}")
        return jsonify({"error": "Internal server error."}), 500


# @app.route('/upload', methods=['POST'])
# def upload_image():
#     try:
#         logger.info("Received /upload request.")

#         if 'image' not in request.files:
#             logger.warning("No image part in the request.")
#             return jsonify({"error": "No image uploaded."}), 400

#         file = request.files['image']
#         if file.filename == '':
#             logger.warning("No selected file in the request.")
#             return jsonify({"error": "No selected file."}), 400

#         # Save the uploaded image locally
#         image_path = os.path.join(UPLOAD_DIR, file.filename)
#         file.save(image_path)
#         logger.info(f"Saved uploaded image to {image_path}.")

#         # Correct the image orientation based on EXIF data
#         correct_image_orientation(image_path)

#         # Compress the image
#         compress_image(image_path)

#         # Recognize faces
#         recognized_ids = face_recognition_module.recognize_faces(image_path)
#         logger.info('Face recognition completed.')
#         logger.info(f'Detected {len(recognized_ids)} faces.')

#         # Validate that exactly two faces are detected
#         if len(recognized_ids) != 2:
#             logger.warning(f"Incorrect number of faces detected: {len(recognized_ids)}.")
#             return jsonify({
#                 "error": "Exactly two faces must be in the photo.",
#                 "detected_faces": len(recognized_ids)
#             }), 400

#         # Upload the main selfie to Supabase Storage
#         with open(image_path, 'rb') as image_file:
#             image_bytes = image_file.read()
#             selfie_filename = f"selfies/{uuid.uuid4()}.jpg"
#             try:
#                 selfie_upload = supabase.storage.from_('selfies').upload(
#                     selfie_filename,
#                     image_bytes,
#                     {"content-type": "image/jpeg"}
#                 )
#                 logger.info(f"Selfie upload response: {selfie_upload}")
#             except Exception as upload_error:
#                 logger.exception(f"Exception during selfie upload: {upload_error}")
#                 return jsonify({"error": "Failed to upload selfie."}), 500

#         # Get the public URL of the uploaded selfie
#         selfie_url = supabase.storage.from_('selfies').get_public_url(selfie_filename)
#         logger.info(f"Selfie uploaded to Supabase at {selfie_url}.")

#         # Crop faces and create avatars
#         try:
#             avatars = crop_faces(image_path, recognized_ids)
#         except Exception as crop_error:
#             logger.exception(f"Exception during cropping faces: {crop_error}")
#             return jsonify({"error": "Failed to crop faces."}), 500

#         avatar_paths = []
#         for user_id, avatar_bytes in avatars:
#             avatar_filename = f"avatars/{uuid.uuid4()}_{user_id}.jpg"
#             try:
#                 avatar_upload = supabase.storage.from_('avatars').upload(
#                     avatar_filename,
#                     avatar_bytes,
#                     {"content-type": "image/jpeg"}
#                 )
#                 logger.info(f"Avatar upload response for {user_id}: {avatar_upload}")
#             except Exception as avatar_upload_error:
#                 logger.exception(f"Exception during avatar upload for {user_id}: {avatar_upload_error}")
#                 continue  # Skip this avatar

#             # Get the public URL of the uploaded avatar
#             avatar_url = supabase.storage.from_('avatars').get_public_url(avatar_filename)
#             avatar_paths.append({
#                 "user_id": user_id,
#                 "avatar_url": avatar_url
#             })
#             logger.info(f"Avatar for {user_id} uploaded to Supabase at {avatar_url}.")

#         if len(avatar_paths) != 2:
#             logger.error("Not all avatars were successfully uploaded.")
#             return jsonify({"error": "Failed to upload all avatars."}), 500

#         # Insert record into Supabase database
#         data = {
#             "selfie_url": selfie_url,
#             "user1_id": recognized_ids[0],
#             "user2_id": recognized_ids[1],
#             "avatar1_url": avatar_paths[0]['avatar_url'],
#             "avatar2_url": avatar_paths[1]['avatar_url']
#             # "timestamp": datetime.now(timezone.utc)  # Omit to let Supabase handle it
#         }

#         try:
#             db_insert = supabase.table('friend_connections').insert(data).execute()
#             logger.info(f"Database insert response: {db_insert}")
#             logger.info(f"db_insert data: {db_insert.data}")
#             logger.info(f"db_insert error: {db_insert.error}")
#             logger.info(f"db_insert status_code: {db_insert.status_code}")
#             logger.info(f"db_insert status_text: {db_insert.status_text}")

#             # Check for errors in the response
#             if db_insert.error or db_insert.status_code != 201:
#                 logger.error(f"Error inserting record into database: {db_insert.error}, Status code: {db_insert.status_code}")
#                 return jsonify({"error": "Failed to store connection data."}), 500

#         except Exception as db_error:
#             logger.exception(f"Exception during database insert: {db_error}")
#             return jsonify({"error": "Failed to store connection data."}), 500

#         logger.info("Friend connection data stored successfully.")
#         return jsonify({
#             "recognized_ids": recognized_ids,
#             "selfie_url": selfie_url,
#             "avatars": avatar_paths
#         }), 200

#     except Exception as e:
#         error_message = f"Exception during /upload: {str(e)}\n{traceback.format_exc()}"
#         logger.exception(error_message)
#         return jsonify({"error": "Internal server error."}), 500





@app.route('/')
def index():
    return '''
    <h1>Real-Time ID Check</h1>
    <form method="post" action="/upload" enctype="multipart/form-data">
      <input type="file" name="image" accept="image/*" required>
      <input type="submit" value="Upload">
    </form>
    '''
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=6000)
