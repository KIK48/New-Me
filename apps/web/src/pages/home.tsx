

import '../styles/pages/home.css'

export default function Home() {
  
  return (
    <div className='Home '>
      <div className='Habits-Created focus-glow container letters' tabIndex={0}> 5 Habits Created</div>
      <div className='Best-Habit focus-glow container letters' tabIndex={0}>Coding</div>
      <div className='Progress-Week focus-glow container letters' tabIndex={0}> Week's Progress</div>
    </div>
  );
}

