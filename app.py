import os
from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
from face_recognition_face_recognition import FaceRecognitionFaceRecognition
from face_recognition_interface import FaceRecognitionInterface


# The orientation of the photo matters in the picture. Add functionality for that


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

        # Recognize faces
        recognized_ids = face_recognition_module.recognize_faces(image_path)
        print('Face recognition completed.')
        print(f'Detected {len(recognized_ids)} faces.')

        # Validate that exactly two faces are detected
        if len(recognized_ids) != 2:
            print(f"Incorrect number of faces detected: {len(recognized_ids)}.")
            return jsonify({"error": "Exactly two faces must be in the photo.", "detected_faces": len(recognized_ids)}), 400

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
