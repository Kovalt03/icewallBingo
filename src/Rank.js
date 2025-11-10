// src/RankingPage.js
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';
import { countBingoLines } from './App'; // 유틸 함수 재사용

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const RankingPage = () => {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const snap = await getDocs(collection(db, 'bingoPlayers'));
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setPlayers(data);
    };
    fetchPlayers();
  }, []);

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">🏆 빙고 랭킹</h1>
      <table className="border-collapse border w-full">
        <thead>
          <tr>
            <th className="border p-2">팀</th>
            <th className="border p-2">완성 줄 수</th>
          </tr>
        </thead>
        <tbody>
          {players.map(d => (
            <tr key={d.id} className="hover:bg-gray-100 cursor-pointer" onClick={() => window.location.href = `/?token=${d.id}`}>
              <td className="border p-2">{d.id}</td>
              <td className="border p-2">{countBingoLines(d.numbers || [], d.completed || [])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RankingPage;
