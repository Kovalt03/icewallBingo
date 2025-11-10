// src/App.js
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BOARD_SIZE = 5;
const CELL_SIZE = 60;

export const countBingoLines = (numbers, completed) => {
  const size = BOARD_SIZE;
  let count = 0;

  // 가로
  for (let i = 0; i < size; i++) {
    let row = numbers.slice(i*size, i*size + size);
    if (row.every(n => completed.includes(n))) count++;
  }

  // 세로
  for (let j = 0; j < size; j++) {
    let col = [];
    for (let i = 0; i < size; i++) col.push(numbers[i*size + j]);
    if (col.every(n => completed.includes(n))) count++;
  }

  // 대각선
  let diag1 = [], diag2 = [];
  for (let i = 0; i < size; i++) {
    diag1.push(numbers[i*size + i]);
    diag2.push(numbers[i*size + (size-1-i)]);
  }
  if (diag1.every(n => completed.includes(n))) count++;
  if (diag2.every(n => completed.includes(n))) count++;

  return count;
};

const BingoApp = ({ token: propToken, readOnly = false }) => {
  const [numbers, setNumbers] = useState(Array(BOARD_SIZE*BOARD_SIZE).fill(''));
  const [locked, setLocked] = useState(false);
  const [missions, setMissions] = useState({});
  const [completed, setCompleted] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [error, setError] = useState('');
  const [showAllMissions, setShowAllMissions] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = propToken || params.get('token');
  const playerDocRef = token ? doc(db, 'bingoPlayers', token) : null;

  // 미션 구독
  useEffect(() => {
    if (!token) return;
    const unsub = onSnapshot(doc(db, 'bingo', 'missions'), snap => {
      if (snap.exists()) setMissions(snap.data());
    });
    return () => unsub();
  }, [token]);

  // 플레이어 데이터
  useEffect(() => {
    if (!token || !playerDocRef) return;
    getDoc(playerDocRef).then(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNumbers(data.numbers || []);
        setLocked(readOnly ? true : data.locked || false);
        setCompleted(data.completed || []);
      } else {
        setLocked(readOnly);
      }
    });
  }, [token, playerDocRef, readOnly]);

  const lockBoard = async () => {
    if (!numbers.every(n => n)) {
      setError('모든 칸을 채워야 합니다.');
      return;
    }
    await setDoc(playerDocRef, { numbers, locked: true, completed });
    setLocked(true);
  };

  const handleCellClick = (num) => {
    if (!locked) return;
    const mission = missions[num];
    if (!mission || !mission.public) return alert('아직 공개되지 않은 미션입니다.');
    setSelectedMission({ num, ...mission });
  };

  const toggleComplete = async () => {
    if (!selectedMission) return;
    const n = selectedMission.num;
    let newCompleted;
    if (completed.includes(n)) {
      newCompleted = completed.filter(x => x!==n);
    } else {
      newCompleted = [...completed, n];
    }
    setCompleted(newCompleted);
    await updateDoc(playerDocRef, { completed: newCompleted });
  };

  const handleInputChange = (index, value) => {
    if (locked) return;
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > 25) return;
    const newNums = [...numbers];
    newNums[index] = num;
    setNumbers(newNums);
  };

  const handleInputBlur = (index) => {
    const num = numbers[index];
    if (num === '') return;
    const otherNumbers = numbers.filter((_, i) => i !== index);
    if (otherNumbers.includes(num)) {
      const availableNumbers = [];
      for (let i = 1; i <= 25; i++) {
        if (!otherNumbers.includes(i)) availableNumbers.push(i);
      }
      setError(`중복된 숫자입니다! 사용 가능한 번호: ${availableNumbers.join(', ')}`);
      const newNums = [...numbers];
      newNums[index] = '';
      setNumbers(newNums);
    } else setError('');
  };

  const renderBoard = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
      gridGap: '10px',
      justifyContent: 'center'
    }}>
      {numbers.map((num, i) => !locked || readOnly ? (
        <input
          key={i}
          type="number"
          min="1"
          max="25"
          value={num}
          onChange={(e) => handleInputChange(i, e.target.value)}
          onBlur={() => handleInputBlur(i)}
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            textAlign: 'center',
            fontSize: '1.2rem',
            borderRadius: '8px',
            border: '1px solid #ccc'
          }}
          disabled={readOnly}
        />
      ) : (
        <button
          key={i}
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            fontSize: '1.2rem',
            borderRadius: '8px',
            border: '1px solid #ccc',
            backgroundColor: completed.includes(num) ? '#34D399' : '#FFFFFF',
            color: completed.includes(num) ? '#FFFFFF' : '#000000'
          }}
          onClick={() => handleCellClick(num)}
        >
          {num}
        </button>
      ))}
    </div>
  );

  if (!token && !readOnly) {
    return <div className="p-4 text-center"><h2>토큰이 필요합니다.</h2></div>;
  }

  return (
    <div className="flex flex-col items-center p-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">🔥 Firebase Bingo Game</h1>
      {renderBoard()}
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {!locked && !readOnly &&
        <button onClick={lockBoard} className="bg-blue-500 text-white px-4 py-2 rounded mt-4">빙고판 고정하기</button>
      }

      {/* 전체 미션 보기 */}
      <button onClick={() => setShowAllMissions(prev => !prev)} className="bg-gray-500 text-white px-4 py-2 rounded mt-2">
        {showAllMissions ? "미션 닫기" : "전체 미션 보기"}
      </button>
      {showAllMissions && (
        <div className="grid grid-cols-1 gap-2 mt-2 w-full max-w-md">
          {Object.keys(missions).sort((a,b)=>a-b).map(num => {
            const mission = missions[num];
            if (!mission.public) return null;
            return (
              <div key={num} className="border p-2 rounded flex items-center justify-between">
                <span>{num}. {mission.text}</span>
                <input
                  type="checkbox"
                  checked={completed.includes(parseInt(num))}
                  onChange={async () => {
                    const n = parseInt(num);
                    let newCompleted;
                    if (completed.includes(n)) {
                      newCompleted = completed.filter(x => x!==n);
                    } else {
                      newCompleted = [...completed, n];
                    }
                    setCompleted(newCompleted);
                    await updateDoc(playerDocRef, { completed: newCompleted });
                  }}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* 미션 팝업 */}
      {selectedMission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <h2 className="text-xl font-bold mb-2">미션 {selectedMission.num}</h2>
            <p className="mb-4">{selectedMission.text}</p>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={completed.includes(selectedMission.num)}
                onChange={toggleComplete}
                className="mr-2"
              />
              완료
            </label>
            <button onClick={() => setSelectedMission(null)} className="mt-2 text-gray-600 underline w-full">
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 현재 줄수 */}
      <p className="mt-4 font-bold">완성된 줄 수: {countBingoLines(numbers, completed)}</p>
    </div>
  );
};

export default BingoApp;
