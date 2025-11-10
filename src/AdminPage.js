// src/AdminPage.js
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, updateDoc, onSnapshot } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const AdminPage = () => {
  const [missions, setMissions] = useState({});
  const [players, setPlayers] = useState([]);

  // 미션 불러오기
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'bingo', 'missions'), snap => {
      if (snap.exists()) setMissions(snap.data());
      else {
        // 초기화: 1~25번
        const init = {};
        for (let i = 1; i <= 25; i++) init[i] = { text: '', public: false };
        setMissions(init);
      }
    });
    return () => unsub();
  }, []);

  // 팀 리스트 불러오기
  useEffect(() => {
    const fetchPlayers = async () => {
      const snap = await getDocs(collection(db, 'bingoPlayers'));
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setPlayers(data);
    };
    fetchPlayers();
  }, []);

  // 미션 수정
  const handleMissionChange = (num, field, value) => {
    setMissions(prev => ({
      ...prev,
      [num]: { ...prev[num], [field]: value }
    }));
  };

  const saveMissions = async () => {
    await setDoc(doc(db, 'bingo', 'missions'), missions);
    alert('저장되었습니다.');
  };

  // 팀 lock 해제/잠금
  const toggleLock = async (teamId, locked) => {
    await updateDoc(doc(db, 'bingoPlayers', teamId), { locked });
    setPlayers(prev => prev.map(p => p.id === teamId ? { ...p, locked } : p));
  };

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">🎯 관리자 페이지</h1>

      {/* 팀 관리 */}
      <h2 className="text-xl font-bold mb-2">팀 잠금 관리</h2>
      <table className="border-collapse border w-full mb-6">
        <thead>
          <tr>
            <th className="border p-2">팀</th>
            <th className="border p-2">Locked</th>
          </tr>
        </thead>
        <tbody>
          {players.map(p => (
            <tr key={p.id}>
              <td className="border p-2">{p.id}</td>
              <td className="border p-2 text-center">
                <input
                  type="checkbox"
                  checked={p.locked}
                  onChange={e => toggleLock(p.id, e.target.checked)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 미션 관리 */}
      <h2 className="text-xl font-bold mb-2">미션 관리</h2>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 25 }, (_, i) => i + 1).map(num => (
          <div key={num} className="border p-2 rounded">
            <p className="font-bold">{num}</p>
            <input
              type="text"
              value={missions[num]?.text || ''}
              onChange={e => handleMissionChange(num, 'text', e.target.value)}
              className="border w-full mb-1 p-1 rounded"
            />
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={missions[num]?.public || false}
                onChange={e => handleMissionChange(num, 'public', e.target.checked)}
                className="mr-1"
              />
              공개
            </label>
          </div>
        ))}
      </div>
      <button onClick={saveMissions} className="bg-blue-500 text-white px-4 py-2 rounded mt-4">
        저장
      </button>
    </div>
  );
};

export default AdminPage;
