// src/RankingPage.js
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';
import BingoApp from './App';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const RankingPage = () => {
  const [players, setPlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      const snapshot = await getDocs(collection(db, 'bingoPlayers'));
      const data = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        data.push({
          token: docSnap.id,
          completedCount: d.completed ? d.completed.length : 0,
          total: d.numbers ? d.numbers.length : 0
        });
      });
      data.sort((a,b) => b.completedCount - a.completedCount);
      setPlayers(data);
    };
    fetchPlayers();
  }, []);

  if (selectedTeam) return <BingoApp token={selectedTeam} readOnly={true} />;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">🏆 현재 빙고 랭킹</h1>
      <table className="border-collapse border w-full">
        <thead>
          <tr>
            <th className="border p-2">팀</th>
            <th className="border p-2">클리어 수</th>
            <th className="border p-2">전체 칸</th>
          </tr>
        </thead>
        <tbody>
          {players.map(p => (
            <tr key={p.token} className="cursor-pointer hover:bg-gray-100" onClick={() => setSelectedTeam(p.token)}>
              <td className="border p-2">{p.token}</td>
              <td className="border p-2">{p.completedCount}</td>
              <td className="border p-2">{p.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RankingPage;
