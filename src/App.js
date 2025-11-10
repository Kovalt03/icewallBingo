import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig'; // 🔥 별도 파일로 분리된 설정 가져오기

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BingoApp = () => {
  const [numbers, setNumbers] = useState(Array(25).fill(''));
  const [locked, setLocked] = useState(false);
  const [missions, setMissions] = useState({});
  const [completed, setCompleted] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [answer, setAnswer] = useState('');

  // ✅ Firestore 실시간 미션 수신
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'bingo', 'missions'), (snap) => {
      if (snap.exists()) setMissions(snap.data());
    });
    return () => unsub();
  }, []);

  // ✅ 빙고판 고정 및 업로드
  const lockBoard = async () => {
    await setDoc(doc(db, 'bingo', 'player'), { numbers });
    setLocked(true);
  };

  // ✅ 미션 클릭 시 팝업 표시
  const handleCellClick = (num) => {
    if (!locked) return;
    if (!missions[num]) return alert('아직 공개되지 않은 미션입니다!');
    setSelectedMission({ num, text: missions[num] });
  };

  // ✅ 정답 제출 처리
  const submitAnswer = async () => {
    if (answer.trim() === '') return;
    await setDoc(doc(db, 'bingo', 'answers', selectedMission.num.toString()), {
      answer,
      timestamp: Date.now(),
    });
    setCompleted((prev) => [...prev, selectedMission.num]);
    setSelectedMission(null);
    setAnswer('');
  };

  const handleInputChange = (index, value) => {
    const newNums = [...numbers];
    newNums[index] = value;
    setNumbers(newNums);
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">🔥 Firebase Bingo Game</h1>

      {!locked ? (
        <div className="grid grid-cols-5 gap-2 mb-4">
          {numbers.map((num, i) => (
            <input
              key={i}
              type="number"
              min="1"
              max="25"
              value={num}
              onChange={(e) => handleInputChange(i, e.target.value)}
              className="w-16 h-16 text-center border rounded"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-2 mb-4">
          {numbers.map((num, i) => (
            <button
              key={i}
              className={`w-16 h-16 text-center border rounded font-bold ${
                completed.includes(num) ? 'bg-green-400 text-white' : 'bg-white'
              }`}
              onClick={() => handleCellClick(num)}
            >
              {num}
            </button>
          ))}
        </div>
      )}

      {!locked && (
        <button
          onClick={lockBoard}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          빙고판 고정하기
        </button>
      )}

      {selectedMission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <h2 className="text-xl font-bold mb-2">미션 {selectedMission.num}</h2>
            <p className="mb-4">{selectedMission.text}</p>
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="정답 입력"
              className="border w-full mb-3 p-2 rounded"
            />
            <button
              onClick={submitAnswer}
              className="bg-green-500 text-white px-4 py-2 rounded w-full"
            >
              제출하기
            </button>
            <button
              onClick={() => setSelectedMission(null)}
              className="mt-2 text-gray-600 underline w-full"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BingoApp;