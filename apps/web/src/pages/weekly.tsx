

import '../styles/pages/weekly.css' // change

export default function Weekly() {
  
  return (
    <div className='Weekly focus-glow container' tabIndex={0}>

      <div className='top-selector strip'>
        <div className='date strip strip--info letters'>1/5/2026</div>
        <button className='arrow-btn'>
          <svg className = "i-btn" width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M30 16H2M2 16L16 30M2 16L16 2" 
              stroke="currentColor" 
              strokeWidth="4" 
              strokeLinecap="round" 
            />
          </svg>
        </button>
        <button className='arrow-btn'>
          <svg className = "i-btn" width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M2 16H30M30 16L16 2M30 16L16 30" 
              stroke="currentColor" 
              stroke-width="4" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>

        </button>
        <div className='date strip strip--info letters'>1/11/2026</div>
      </div>

      <div className='info-displayer strip strip--info letters'>
        Habit Mon Tues Wed Thurs Fri Sat Sun
      </div>
      <div className='habits'>
        <div className='Habit strip'>
          <div className='Title-Habit strip letters'>Gym</div>
          <div className='Boxes-Habit strip'>
            <div className='box-selector'></div>
            <div className='box-selector'></div>
            <div className='box-selector'></div>
            <div className='box-selector'></div>
            <div className='box-selector'></div>
            <div className='box-selector'></div>
            <div className='box-selector'></div>
          </div>
        </div>
        <div className='Habit strip'>
          <div className='Title-Habit strip letters'>Leet</div>
          <div className='Boxes-Habit strip'></div>
        </div>
        <div className='Habit strip'>
          <div className='Title-Habit strip letters'>Clean Room</div>
          <div className='Boxes-Habit strip'></div>
        </div>
      </div>
    </div>
  );
}

