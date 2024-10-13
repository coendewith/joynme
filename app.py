import os
from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
from face_recognition_face_recognition import FaceRecognitionFaceRecognition
from face_recognition_interface import FaceRecognitionInterface
from PIL import Image, ExifTags  # Import Pillow modules for image processing


app = Flask(__name__)
# Allow all origins for development purposes
CORS(app, resources={r"/*": {"origins": "*"}})

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
