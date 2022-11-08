import json
import cv2
import numpy as np
import face_recognition
import os
from datetime import datetime
from json import JSONEncoder
import codecs


class NumpyArrayEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()

        return JSONEncoder.default(self, obj)


path = 'fr_images'
images = []
classNames = []
myList = os.listdir(path)
print(myList)
for cl in myList:
    curImg = cv2.imread(f'{ path }/{ cl }')
    images.append(curImg)
    classNames.append(os.path.splitext(cl)[0])

print(classNames)


def markAttendance(name):
    with open(' Attendance.csv ', ' r + ') as f:
        myDataList = f.readlines()
        nameList = []
        for line in myDataList:
            entry = line.split(' , ')
            nameList.append(entry[0])
            if name not in nameList:
                now = datetime.now()
                dtString = now.strftime('% H: % M: % S')
                f.writelines(f'\n{ name } , { dtString }')


def findEncodings(images):
    encodeList = []
    for img in images:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        encode = face_recognition.face_encodings(img)[0]
        encodeList.append(encode)
    return encodeList


encodeListKnown = findEncodings(images)


# var1 = encodeListKnown[0].tolist()
# print(type(var1))
print('Encoding Complete')
# cap = cv2.VideoCapture(0)

# print(var1)

# text = json.dumps(var1, codecs.open('encode_data', 'w', encoding='utf-8'),
#                   separators=(',', ':'),
#                   sort_keys=True,
#                   indent=4)

# print(encodeListKnown[0].shape)
# print(type(encodeListKnown))
# print(len(encodeListKnown))
print(encodeListKnown)


cap = cv2.VideoCapture(1)
while True:
    success, img = cap.read()
    # img = cv2.imread('AshishPal_test.png')

    imgS = cv2.resize(img, (0, 0), None,  0.25, 0.25)
    imgS = cv2.cvtColor(imgS, cv2.COLOR_BGR2RGB)
    facesCurFrame = face_recognition.face_locations(imgS)
    encodesCurFrame = face_recognition.face_encodings(imgS, facesCurFrame)
    for encodeFace, faceLoc in zip(encodesCurFrame, facesCurFrame):
        matches = face_recognition.compare_faces(encodeListKnown, encodeFace)
        faceDis = face_recognition.face_distance(encodeListKnown, encodeFace)
        print(faceDis)
        matchIndex = np.argmin(faceDis)
        if matches[matchIndex]:
            name = classNames[matchIndex].upper()
            print(name)
            y1, x2, y2, x1 = faceLoc
            y1, x2, y2, x1 = y1 * 4, x2 * 4, y2 * 4, x1 * 4
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.rectangle(img, (x1, y2-35), (x2, y2), (0, 255, 0), cv2.FILLED)
            cv2.putText(img, name, (x1 + 6, y2-6),
                        cv2.FONT_HERSHEY_COMPLEX, 1, (255, 255, 255), 2)

    cv2.imshow('Webcam', img)
    cv2.waitKey(1)


# imgElon = face_recognition.load_image_file('fr_images/elon_musk.jpg')
# imgElon = cv2.cvtColor(imgElon, cv2.COLOR_BGR2RGB)
# # imgTest = face_recognition.load_image_file('fr_images/scarlett_johansson.jpg')
# imgTest = face_recognition.load_image_file('fr_images/scarlett_johansson.jpg')
# imgTest = cv2.cvtColor(imgTest, cv2.COLOR_BGR2RGB)
