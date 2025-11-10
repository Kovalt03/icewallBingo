import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BOARD_SIZE = 5;
const CELL_SIZE = 60;

const BingoApp = () => {
  const [numbers, setNumbers] = useState(Array(BOARD_SIZE * BOARD_SIZE).fill(''));
  const [locked, setLocked] = useState(false);
  const [missions, setMissions] = useState({});
  const [completed, setCompleted] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  // URL 파라미터에서 token 가져오기
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  // playerDocRef 정의
  const playerDocRef = token ? doc(db, 'bingoPlayers', token) : null;

  // Hook 호출은 항상 최상단에서, 내부에서 token 체크
  useEffect(() => {
    if (!token) return;
    const unsub = onSnapshot(doc(db, 'bingo', 'missions'), snap => {
      if (snap.exists()) setMissions(snap.data());
    });
    return () => unsub();
  }, [token]);

  useEffect(() => {
    if (!token || !playerDocRef) return;
    getDoc(playerDocRef).then(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNumbers(data.numbers || []);
        setLocked(data.locked || false);
        setCompleted(data.completed || []);
      }
    });
  }, [token, playerDocRef]);

  const lockBoard = async () => {
    if (!numbers.every(n => n)) {
      setError('모든 칸을 채워야 합니다.');
      return;
    }
    await setDoc(playerDocRef, { numbers, locked: true, completed: [] });
    setLocked(true);
  };

  const handleCellClick = (num) => {
    if (!locked) return;
    if (!missions[num]) return alert('아직 공개되지 않은 미션입니다!');
    setSelectedMission({ num, text: missions[num] });
  };

  const submitAnswer = async () => {
    if (answer.trim() === '') return;

    const ansDocRef = doc(db, 'bingoAnswers', token + '_' + selectedMission.num);
    const docSnap = await getDoc(ansDocRef);
    if (docSnap.exists()) {
      alert('이미 제출한 미션입니다.');
      return;
    }

    await setDoc(ansDocRef, { answer, timestamp: Date.now() });
    setCompleted(prev => [...prev, selectedMission.num]);

    await setDoc(playerDocRef, { numbers, locked, completed: [...completed, selectedMission.num] });

    setSelectedMission(null);
    setAnswer('');
  };

  const handleInputChange = (index, value) => {
    if (locked) return;

    if (value === '') {
      const newNums = [...numbers];
      newNums[index] = '';
      setNumbers(newNums);
      setError('');
      return;
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > 25) return;

    const newNums = [...numbers];
    newNums[index] = num;
    setNumbers(newNums);
    setError('');
  };

  const handleInputBlur = (index) => {
    const num = numbers[index];
    if (num === '') return;

    const otherNumbers = numbers.filter((n, i) => i !== index);
    if (otherNumbers.includes(num)) {
      const availableNumbers = [];
      for (let i = 1; i <= 25; i++) {
        if (!otherNumbers.includes(i)) availableNumbers.push(i);
      }
      setError(`중복된 숫자입니다! 사용 가능한 번호: ${availableNumbers.join(', ')}`);
      const newNums = [...numbers];
      newNums[index] = '';
      setNumbers(newNums);
    } else {
      setError('');
    }
  };

  const renderBoard = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
      gridGap: '10px',
      justifyContent: 'center'
    }}>
      {numbers.map((num, i) => !locked ? (
        <input
          key={i}
          type="number"
          min="1"
          max="25"
          value={num}
          onChange={(e) => handleInputChange(i, e.target.value)}
          onBlur={() => handleInputBlur(i)}
          style={{ width: CELL_SIZE, height: CELL_SIZE, textAlign: 'center', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid #ccc' }}
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
        >{num}</button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col items-center p-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">아이스월 가을 MT 미션 빙고</h1>
      {renderBoard()}
      {error && <p className="text-red-500 mt-2">{error}</p>}

      {!locked && <button onClick={lockBoard} className="bg-blue-500 text-white px-4 py-2 rounded mt-4">빙고판 고정하기</button>}

      {selectedMission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <h2 className="text-xl font-bold mb-2">미션 {selectedMission.num}</h2>
            <p className="mb-4">{selectedMission.text}</p>
            <input value={answer} onChange={e => setAnswer(e.target.value)} placeholder="정답 입력" className="border w-full mb-3 p-2 rounded" />
            <button onClick={submitAnswer} className="bg-green-500 text-white px-4 py-2 rounded w-full">제출하기</button>
            <button onClick={() => setSelectedMission(null)} className="mt-2 text-gray-600 underline w-full">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BingoApp;