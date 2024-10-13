import face_recognition
import numpy as np
from typing import List, Tuple
from face_recognition_interface import FaceRecognitionInterface

class FaceRecognitionFaceRecognition(FaceRecognitionInterface):
    def __init__(self):
        self.known_face_encodings = []
        self.known_face_ids = []

    def initialize(self):
        """Initialize any required resources."""
        # For face_recognition, no initialization is necessary
        print("FaceRecognitionFaceRecognition initialized.")

    def encode_known_faces(self, known_faces: List[Tuple[str, str]]):
        """
        Encode and store known faces.
        
        :param known_faces: List of tuples containing (user_id, image_path)
        """
        for user_id, image_path in known_faces:
            image = self.load_image_file(image_path)
            encodings = face_recognition.face_encodings(image)
            if encodings:
                self.known_face_encodings.append(encodings[0])
                self.known_face_ids.append(user_id)
                print(f"Encoded and added user_id: {user_id}")
            else:
                print(f"No face found in image: {image_path}")

    def recognize_faces(self, image_path: str) -> List[str]:
        """
        Recognize faces in the given image.
        
        :param image_path: Path to the image file.
        :return: List of recognized user IDs.
        """
        image = self.load_image_file(image_path)
        face_locations = self.get_face_locations(image)
        face_encodings = face_recognition.face_encodings(image, face_locations)

        recognized_ids = []
        for encoding in face_encodings:
            matches = face_recognition.compare_faces(self.known_face_encodings, encoding, tolerance=0.6)
            face_distances = face_recognition.face_distance(self.known_face_encodings, encoding)
            best_match_index = np.argmin(face_distances) if face_distances.size > 0 else -1

            if best_match_index != -1 and matches[best_match_index]:
                recognized_ids.append(self.known_face_ids[best_match_index])
            else:
                recognized_ids.append("Unknown")
        return recognized_ids

    def load_image_file(self, file_path: str):
        """
        Load an image file into a numpy array.
        
        :param file_path: Path to the image file.
        :return: Numpy array representation of the image.
        """
        return face_recognition.load_image_file(file_path)

    def get_face_locations(self, image):
        """
        Detect face locations in an image.
        
        :param image: Numpy array representation of the image.
        :return: List of face locations.
        """
        return face_recognition.face_locations(image)
