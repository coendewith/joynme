# face_recognition_interface.py

from abc import ABC, abstractmethod
from typing import List, Tuple

class FaceRecognitionInterface(ABC):
    @abstractmethod
    def initialize(self):
        """Initialize the face recognition system."""
        pass

    @abstractmethod
    def encode_known_faces(self, known_faces: List[Tuple[str, str]]):
        """
        Encode and store known faces.
        
        :param known_faces: List of tuples containing (user_id, image_path)
        """
        pass

    @abstractmethod
    def recognize_faces(self, image_path: str) -> List[str]:
        """
        Recognize faces in the given image.
        
        :param image_path: Path to the image file.
        :return: List of recognized user IDs.
        """
        pass
