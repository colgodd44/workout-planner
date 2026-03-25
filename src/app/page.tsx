'use client';

import { useState, useEffect, useRef } from 'react';

interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  gender: string;
  bodyType: string;
  goal: string;
  experience: string;
  photo: string;
  createdAt: string;
}

interface Workout {
  day: string;
  title: string;
  exercises: { name: string; sets: string }[];
}

interface Meal {
  type: string;
  name: string;
  calories: number;
  protein: string;
  carbs: string;
}

const BODY_TYPES = [
  { id: 'ectomorph', icon: '🔵', name: 'Ectomorph', desc: 'Thin, hard to gain weight' },
  { id: 'mesomorph', icon: '🟢', name: 'Mesomorph', desc: 'Athletic, muscular' },
  { id: 'endomorph', icon: '🟠', name: 'Endomorph', desc: 'Broader, gains easily' },
];

const GOALS = [
  { id: 'lose_weight', icon: '🔥', name: 'Lose Weight', desc: 'Burn fat & get lean' },
  { id: 'build_muscle', icon: '💪', name: 'Build Muscle', desc: 'Get bigger & stronger' },
  { id: 'tone_up', icon: '✨', name: 'Tone Up', desc: 'Define & sculpt' },
  { id: 'bulk', icon: '🏋️', name: 'Bulk Up', desc: 'Maximum mass' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner', icon: '🌱' },
  { id: 'intermediate', label: 'Intermediate', icon: '🌿' },
  { id: 'advanced', label: 'Advanced', icon: '🌳' },
];

const WORKOUTS_BY_GOAL: Record<string, Workout[]> = {
  lose_weight: [
    { day: 'Day 1 - Monday', title: 'Full Body Fat Burner', exercises: [
      { name: 'Warm-up: Jumping Jacks', sets: '3 min' },
      { name: 'Bodyweight Squats', sets: '3x15' },
      { name: 'Push-ups', sets: '3x12' },
      { name: 'Lunges', sets: '3x10 each leg' },
      { name: 'Plank', sets: '3x45 sec' },
      { name: 'Mountain Climbers', sets: '3x20' },
      { name: 'Burpees', sets: '3x10' },
    ]},
    { day: 'Day 2 - Tuesday', title: 'Cardio & Core', exercises: [
      { name: 'Warm-up: March in place', sets: '3 min' },
      { name: 'High Knees', sets: '3x30 sec' },
      { name: 'Bicycle Crunches', sets: '3x20' },
      { name: 'Russian Twists', sets: '3x16' },
      { name: 'Leg Raises', sets: '3x12' },
      { name: 'Jump Squats', sets: '3x15' },
    ]},
    { day: 'Day 3 - Wednesday', title: 'HIIT Circuit', exercises: [
      { name: 'Warm-up: Light jogging', sets: '5 min' },
      { name: 'Sprint in Place', sets: '8x20 sec' },
      { name: 'Rest', sets: '8x10 sec' },
      { name: 'Push-up to Renegade Row', sets: '3x10' },
      { name: 'Goblet Squats', sets: '3x15' },
    ]},
    { day: 'Day 4 - Thursday', title: 'Active Recovery', exercises: [
      { name: 'Light Walking', sets: '20-30 min' },
      { name: 'Stretching', sets: '15 min' },
      { name: 'Foam Rolling', sets: '10 min' },
    ]},
    { day: 'Day 5 - Friday', title: 'Lower Body Focus', exercises: [
      { name: 'Warm-up: Leg Swings', sets: '3 min' },
      { name: 'Sumo Squats', sets: '3x15' },
      { name: 'Glute Bridges', sets: '3x15' },
      { name: 'Calf Raises', sets: '3x20' },
      { name: 'Wall Sit', sets: '3x45 sec' },
    ]},
    { day: 'Day 6 - Saturday', title: 'Upper Body & Cardio', exercises: [
      { name: 'Warm-up: Arm Circles', sets: '2 min' },
      { name: 'Diamond Push-ups', sets: '3x10' },
      { name: 'Tricep Dips', sets: '3x12' },
      { name: 'Superman Hold', sets: '3x30 sec' },
      { name: 'Jump Rope', sets: '5x1 min' },
    ]},
    { day: 'Day 7 - Sunday', title: 'Rest Day', exercises: [
      { name: 'Gentle Stretching', sets: '20 min' },
      { name: 'Light Walk', sets: '15-20 min' },
    ]},
  ],
  build_muscle: [
    { day: 'Day 1 - Push (Chest, Shoulders, Triceps)', title: 'Push Day', exercises: [
      { name: 'Bench Press', sets: '4x10' },
      { name: 'Overhead Press', sets: '4x10' },
      { name: 'Incline Dumbbell Press', sets: '3x12' },
      { name: 'Lateral Raises', sets: '3x15' },
      { name: 'Tricep Pushdowns', sets: '3x12' },
      { name: 'Overhead Tricep Extension', sets: '3x12' },
    ]},
    { day: 'Day 2 - Pull (Back, Biceps)', title: 'Pull Day', exercises: [
      { name: 'Deadlift', sets: '4x8' },
      { name: 'Pull-ups/Lat Pulldown', sets: '4x10' },
      { name: 'Barbell Rows', sets: '3x10' },
      { name: 'Face Pulls', sets: '3x15' },
      { name: 'Barbell Curls', sets: '3x12' },
      { name: 'Hammer Curls', sets: '3x12' },
    ]},
    { day: 'Day 3 - Legs (Quads, Hamstrings, Glutes)', title: 'Leg Day', exercises: [
      { name: 'Squat', sets: '4x10' },
      { name: 'Romanian Deadlift', sets: '4x10' },
      { name: 'Leg Press', sets: '3x12' },
      { name: 'Leg Curls', sets: '3x12' },
      { name: 'Calf Raises', sets: '4x15' },
      { name: 'Leg Extensions', sets: '3x12' },
    ]},
    { day: 'Day 4 - Rest', title: 'Recovery Day', exercises: [
      { name: 'Light Stretching', sets: '20 min' },
      { name: 'Foam Rolling', sets: '15 min' },
      { name: 'Optional: Light Cardio', sets: '20 min' },
    ]},
    { day: 'Day 5 - Push', title: 'Push Day 2', exercises: [
      { name: 'Incline Bench Press', sets: '4x10' },
      { name: 'Dumbbell Shoulder Press', sets: '4x10' },
      { name: 'Cable Flyes', sets: '3x12' },
      { name: 'Arnold Press', sets: '3x12' },
      { name: 'Skull Crushers', sets: '3x12' },
    ]},
    { day: 'Day 6 - Pull', title: 'Pull Day 2', exercises: [
      { name: 'Wide Grip Pull-ups', sets: '4x8' },
      { name: 'T-Bar Rows', sets: '4x10' },
      { name: 'Seated Cable Row', sets: '3x12' },
      { name: 'Rear Delt Flyes', sets: '3x15' },
      { name: 'Preacher Curls', sets: '3x12' },
    ]},
    { day: 'Day 7 - Legs', title: 'Leg Day 2', exercises: [
      { name: 'Front Squat', sets: '4x10' },
      { name: 'Walking Lunges', sets: '3x12 each' },
      { name: 'Hack Squat', sets: '3x12' },
      { name: 'Seated Leg Curl', sets: '3x12' },
      { name: 'Standing Calf Raises', sets: '4x15' },
    ]},
  ],
  tone_up: [
    { day: 'Day 1 - Upper Body', title: 'Toning Upper', exercises: [
      { name: 'Warm-up: Arm Circles', sets: '2 min' },
      { name: 'Light Dumbbell Press', sets: '3x15' },
      { name: 'Bent Over Rows', sets: '3x15' },
      { name: 'Lateral Raises', sets: '3x15' },
      { name: 'Bicep Curls', sets: '3x12' },
      { name: 'Tricep Kickbacks', sets: '3x12' },
      { name: 'Plank', sets: '3x30 sec' },
    ]},
    { day: 'Day 2 - Lower Body', title: 'Toning Lower', exercises: [
      { name: 'Warm-up: Leg Swings', sets: '2 min' },
      { name: 'Goblet Squats', sets: '3x15' },
      { name: 'Glute Bridges', sets: '3x15' },
      { name: 'Leg Lifts', sets: '3x15 each' },
      { name: 'Clamshells', sets: '3x15 each' },
      { name: 'Calf Raises', sets: '3x20' },
    ]},
    { day: 'Day 3 - Cardio & Core', title: 'Cardio Blast', exercises: [
      { name: 'Warm-up: Jumping Jacks', sets: '3 min' },
      { name: 'Jump Rope', sets: '5x1 min' },
      { name: 'High Knees', sets: '3x30 sec' },
      { name: 'Bicycle Crunches', sets: '3x20' },
      { name: 'Russian Twists', sets: '3x20' },
      { name: 'Dead Bug', sets: '3x10 each' },
    ]},
    { day: 'Day 4 - Active Recovery', title: 'Recovery', exercises: [
      { name: 'Gentle Yoga', sets: '30 min' },
      { name: 'Foam Rolling', sets: '10 min' },
    ]},
    { day: 'Day 5 - Full Body', title: 'Total Body Tone', exercises: [
      { name: 'Warm-up: Light Cardio', sets: '5 min' },
      { name: 'Push-ups (knees ok)', sets: '3x10' },
      { name: 'Dumbbell Rows', sets: '3x12' },
      { name: 'Squats to Press', sets: '3x12' },
      { name: 'Lunges', sets: '3x10 each' },
      { name: 'Plank Shoulder Taps', sets: '3x20' },
    ]},
    { day: 'Day 6 - Cardio', title: 'Steady State Cardio', exercises: [
      { name: 'Brisk Walk/Jog', sets: '30-40 min' },
      { name: 'Cool Down Stretches', sets: '10 min' },
    ]},
    { day: 'Day 7 - Rest', title: 'Full Rest', exercises: [
      { name: 'Relaxation', sets: 'Optional yoga' },
    ]},
  ],
  bulk: [
    { day: 'Day 1 - Chest & Triceps', title: 'Mass Chest', exercises: [
      { name: 'Flat Bench Press', sets: '5x5' },
      { name: 'Incline Dumbbell Press', sets: '4x8' },
      { name: 'Cable Flyes', sets: '3x12' },
      { name: 'Overhead Press', sets: '4x6' },
      { name: 'Tricep Pushdowns', sets: '4x10' },
      { name: 'Skull Crushers', sets: '3x10' },
    ]},
    { day: 'Day 2 - Back & Biceps', title: 'Mass Back', exercises: [
      { name: 'Deadlift', sets: '5x5' },
      { name: 'Pull-ups', sets: '4x8-10' },
      { name: 'Barbell Rows', sets: '4x8' },
      { name: 'Seated Cable Row', sets: '3x10' },
      { name: 'Barbell Curls', sets: '4x8' },
      { name: 'Hammer Curls', sets: '3x10' },
    ]},
    { day: 'Day 3 - Legs', title: 'Mass Legs', exercises: [
      { name: 'Back Squat', sets: '5x5' },
      { name: 'Romanian Deadlift', sets: '4x8' },
      { name: 'Leg Press', sets: '4x10' },
      { name: 'Walking Lunges', sets: '3x12' },
      { name: 'Leg Curls', sets: '3x10' },
      { name: 'Calf Raises', sets: '5x15' },
    ]},
    { day: 'Day 4 - Rest', title: 'Recovery', exercises: [
      { name: 'Light Cardio', sets: '20 min' },
      { name: 'Stretching', sets: '15 min' },
    ]},
    { day: 'Day 5 - Chest & Shoulders', title: 'Upper Mass', exercises: [
      { name: 'Incline Bench Press', sets: '5x5' },
      { name: 'Dumbbell Flyes', sets: '3x12' },
      { name: 'Lateral Raises', sets: '4x15' },
      { name: 'Face Pulls', sets: '3x15' },
      { name: 'Dips', sets: '3x10' },
    ]},
    { day: 'Day 6 - Back & Arms', title: 'Pull Mass', exercises: [
      { name: 'Weighted Pull-ups', sets: '4x8' },
      { name: 'T-Bar Row', sets: '4x8' },
      { name: 'Lat Pulldown', sets: '3x10' },
      { name: 'Preacher Curls', sets: '4x10' },
      { name: 'Cable Curls', sets: '3x12' },
    ]},
    { day: 'Day 7 - Legs & Core', title: 'Leg Mass 2', exercises: [
      { name: 'Front Squat', sets: '4x8' },
      { name: 'Leg Extension', sets: '3x12' },
      { name: 'Leg Curl', sets: '3x12' },
      { name: 'Hanging Leg Raises', sets: '3x15' },
      { name: 'Cable Woodchops', sets: '3x12' },
    ]},
  ],
};

const MEALS_BY_GOAL: Record<string, Meal[]> = {
  lose_weight: [
    { type: 'Breakfast', name: 'Egg White Omelette with Spinach', calories: 250, protein: '28g', carbs: '8g' },
    { type: 'Lunch', name: 'Grilled Chicken Salad', calories: 350, protein: '40g', carbs: '15g' },
    { type: 'Dinner', name: 'Baked Salmon with Asparagus', calories: 400, protein: '45g', carbs: '10g' },
    { type: 'Snack', name: 'Greek Yogurt with Berries', calories: 150, protein: '15g', carbs: '12g' },
    { type: 'Breakfast', name: 'Protein Smoothie Bowl', calories: 300, protein: '30g', carbs: '25g' },
    { type: 'Lunch', name: 'Turkey Lettuce Wraps', calories: 280, protein: '35g', carbs: '10g' },
    { type: 'Dinner', name: 'Lean Beef Stir Fry', calories: 380, protein: '42g', carbs: '18g' },
  ],
  build_muscle: [
    { type: 'Breakfast', name: 'Oatmeal with Banana & Whey', calories: 550, protein: '40g', carbs: '70g' },
    { type: 'Lunch', name: 'Chicken Rice & Broccoli', calories: 650, protein: '50g', carbs: '75g' },
    { type: 'Dinner', name: 'Pasta with Ground Turkey', calories: 700, protein: '45g', carbs: '80g' },
    { type: 'Snack', name: 'Peanut Butter on Whole Wheat', calories: 350, protein: '12g', carbs: '30g' },
    { type: 'Breakfast', name: 'Greek Yogurt Parfait', calories: 450, protein: '35g', carbs: '50g' },
    { type: 'Lunch', name: 'Salmon Quinoa Bowl', calories: 600, protein: '48g', carbs: '55g' },
    { type: 'Dinner', name: 'Steak with Sweet Potato', calories: 700, protein: '50g', carbs: '60g' },
  ],
  tone_up: [
    { type: 'Breakfast', name: 'Avocado Toast with Eggs', calories: 380, protein: '20g', carbs: '30g' },
    { type: 'Lunch', name: 'Quinoa Veggie Bowl', calories: 420, protein: '18g', carbs: '55g' },
    { type: 'Dinner', name: 'Grilled Chicken with Veggies', calories: 450, protein: '42g', carbs: '25g' },
    { type: 'Snack', name: 'Apple with Almond Butter', calories: 250, protein: '8g', carbs: '28g' },
    { type: 'Breakfast', name: 'Protein Pancakes', calories: 350, protein: '30g', carbs: '35g' },
    { type: 'Lunch', name: 'Mediterranean Salad', calories: 400, protein: '25g', carbs: '40g' },
    { type: 'Dinner', name: 'Fish Tacos with Slaw', calories: 420, protein: '35g', carbs: '30g' },
  ],
  bulk: [
    { type: 'Breakfast', name: 'Mega Breakfast Burrito', calories: 800, protein: '45g', carbs: '85g' },
    { type: 'Lunch', name: 'Double Chicken Rice Bowl', calories: 850, protein: '60g', carbs: '90g' },
    { type: 'Dinner', name: 'Pasta Bolognese', calories: 900, protein: '50g', carbs: '100g' },
    { type: 'Snack', name: 'Mass Gainer Shake', calories: 600, protein: '35g', carbs: '80g' },
    { type: 'Breakfast', name: 'French Toast with Bacon', calories: 750, protein: '38g', carbs: '80g' },
    { type: 'Lunch', name: 'Beef Burrito Supreme', calories: 820, protein: '52g', carbs: '85g' },
    { type: 'Dinner', name: 'Lasagna with Garlic Bread', calories: 950, protein: '48g', carbs: '95g' },
  ],
};

const SUPPLEMENTS: { name: string; desc: string; icon: string }[] = [
  { name: 'Whey Protein', desc: 'Muscle building & recovery', icon: '💪' },
  { name: 'Creatine', desc: 'Strength & muscle volume', icon: '⚡' },
  { name: 'BCAAs', desc: 'Reduce muscle breakdown', icon: '🔋' },
  { name: 'Caffeine', desc: 'Energy & fat burning', icon: '☕' },
  { name: 'Fish Oil', desc: 'Joint health & recovery', icon: '🐟' },
  { name: 'Vitamin D', desc: 'Bone health & immunity', icon: '☀️' },
  { name: 'ZMA', desc: 'Better sleep & recovery', icon: '🌙' },
  { name: 'Glutamine', desc: 'Immune support', icon: '🛡️' },
];

export default function WorkoutPlanner() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    age: 25,
    weight: 70,
    height: 175,
    gender: 'male',
    bodyType: '',
    goal: '',
    experience: 'beginner',
    photo: '',
    createdAt: '',
  });
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [showWorkouts, setShowWorkouts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('workout-profile');
    if (saved) {
      const data = JSON.parse(saved);
      setProfile(data);
      setShowWorkouts(!!data.goal);
    }
    const savedDays = localStorage.getItem('workout-completed');
    if (savedDays) {
      setCompletedDays(JSON.parse(savedDays));
    }
  }, []);

  const saveProfile = (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    localStorage.setItem('workout-profile', JSON.stringify(newProfile));
  };

  const saveCompletedDays = (days: number[]) => {
    setCompletedDays(days);
    localStorage.setItem('workout-completed', JSON.stringify(days));
  };

  const handlePhotoCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        saveProfile({ photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzePhoto = () => {
    setShowAnalyzeModal(true);
    setTimeout(() => {
      const randomBody = BODY_TYPES[Math.floor(Math.random() * BODY_TYPES.length)].id;
      saveProfile({ bodyType: randomBody });
      setShowAnalyzeModal(false);
    }, 3000);
  };

  const handleGeneratePlan = () => {
    if (!profile.goal) return;
    setShowAnalyzeModal(true);
    setTimeout(() => {
      setShowWorkouts(true);
      setActiveTab('workouts');
      setShowAnalyzeModal(false);
    }, 2500);
  };

  const toggleDayComplete = (dayIndex: number) => {
    if (completedDays.includes(dayIndex)) {
      saveCompletedDays(completedDays.filter(d => d !== dayIndex));
    } else {
      saveCompletedDays([...completedDays, dayIndex]);
    }
  };

  const workouts = profile.goal ? WORKOUTS_BY_GOAL[profile.goal] : [];
  const meals = profile.goal ? MEALS_BY_GOAL[profile.goal] : [];

  const stats = {
    workoutsDone: completedDays.length,
    totalWorkouts: workouts.length,
    streak: calculateStreak(),
  };

  function calculateStreak() {
    if (completedDays.length === 0) return 0;
    let streak = 0;
    const sorted = [...completedDays].sort();
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i] === i) streak++;
      else break;
    }
    return streak;
  }

  return (
    <div className="app">
      <div className="header">
        <div className="logo">FitAI</div>
      </div>

      <div className="nav-tabs">
        {['Profile', 'Workouts', 'Meals', 'Progress'].map(tab => (
          <button
            key={tab}
            className={`nav-tab ${activeTab === tab.toLowerCase() ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.toLowerCase())}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="content">
        {activeTab === 'profile' && (
          <div className="tab-content active">
            <h2 className="section-title">Your Profile</h2>
            
            <div className="card">
              <div className="photo-section">
                <div className="photo-container" onClick={handlePhotoCapture}>
                  {profile.photo ? (
                    <img src={profile.photo} alt="Your photo" />
                  ) : (
                    <span className="photo-placeholder">📷</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden-input"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <div className="photo-buttons">
                  <button className="btn btn-secondary" onClick={handlePhotoCapture}>
                    📸 Take Photo
                  </button>
                  {profile.photo && (
                    <button className="btn btn-primary" onClick={handleAnalyzePhoto}>
                      🔍 Analyze Body
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>Basic Info</h3>
              <div className="input-group">
                <label className="input-label">Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter your name"
                  value={profile.name}
                  onChange={e => saveProfile({ name: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">Age</label>
                  <input
                    type="number"
                    className="input"
                    value={profile.age}
                    onChange={e => saveProfile({ age: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Weight (kg)</label>
                  <input
                    type="number"
                    className="input"
                    value={profile.weight}
                    onChange={e => saveProfile({ weight: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Height (cm)</label>
                <input
                  type="number"
                  className="input"
                  value={profile.height}
                  onChange={e => saveProfile({ height: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Gender</label>
                <div className="select-grid">
                  {['male', 'female'].map(g => (
                    <div
                      key={g}
                      className={`select-option ${profile.gender === g ? 'selected' : ''}`}
                      onClick={() => saveProfile({ gender: g })}
                    >
                      <div className="select-icon">{g === 'male' ? '👨' : '👩'}</div>
                      <div className="select-label">{g === 'male' ? 'Male' : 'Female'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>Your Body Type</h3>
              <div className="select-grid">
                {BODY_TYPES.map(bt => (
                  <div
                    key={bt.id}
                    className={`select-option ${profile.bodyType === bt.id ? 'selected' : ''}`}
                    onClick={() => saveProfile({ bodyType: bt.id })}
                  >
                    <div className="select-icon">{bt.icon}</div>
                    <div className="select-label">{bt.name}</div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{bt.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>Your Goal</h3>
              <div className="goal-cards">
                {GOALS.map(goal => (
                  <div
                    key={goal.id}
                    className={`goal-card ${profile.goal === goal.id ? 'selected' : ''}`}
                    onClick={() => saveProfile({ goal: goal.id })}
                  >
                    <div className="goal-icon">{goal.icon}</div>
                    <div className="goal-title">{goal.name}</div>
                    <div className="goal-desc">{goal.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>Experience Level</h3>
              <div className="select-grid">
                {EXPERIENCE_LEVELS.map(exp => (
                  <div
                    key={exp.id}
                    className={`select-option ${profile.experience === exp.id ? 'selected' : ''}`}
                    onClick={() => saveProfile({ experience: exp.id })}
                  >
                    <div className="select-icon">{exp.icon}</div>
                    <div className="select-label">{exp.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {profile.goal && (
              <button className="generate-btn" onClick={handleGeneratePlan}>
                🚀 Generate My Custom Plan
              </button>
            )}
          </div>
        )}

        {activeTab === 'workouts' && (
          <div className="tab-content active">
            <h2 className="section-title">Your Workout Plan</h2>
            
            {!showWorkouts ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Complete your profile and set a goal to get your personalized workout plan.
                </p>
                <button className="btn btn-primary" onClick={() => setActiveTab('profile')}>
                  Set Up Profile
                </button>
              </div>
            ) : (
              <>
                <div className="weekday-selector">
                  {workouts.map((_, i) => (
                    <div
                      key={i}
                      className={`weekday ${completedDays.includes(i) ? 'completed' : ''}`}
                      onClick={() => toggleDayComplete(i)}
                    >
                      {completedDays.includes(i) ? '✓' : i + 1}
                    </div>
                  ))}
                </div>
                
                {workouts.map((workout, i) => (
                  <div key={i} className="workout-card" style={{ 
                    borderLeftColor: completedDays.includes(i) ? 'var(--success)' : 'var(--accent)'
                  }}>
                    <div className="workout-day">{workout.day}</div>
                    <div className="workout-title">{workout.title}</div>
                    <ul className="workout-exercises">
                      {workout.exercises.map((ex, j) => (
                        <li key={j} className="workout-exercise">
                          <span className="exercise-name">{ex.name}</span>
                          <span className="exercise-sets">{ex.sets}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'meals' && (
          <div className="tab-content active">
            <h2 className="section-title">Meal Plan</h2>
            
            {!profile.goal ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Set your fitness goal to get personalized meal suggestions.
                </p>
              </div>
            ) : (
              <>
                <div className="card" style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, marginBottom: 12 }}>🍽️ Supplements</h3>
                  {SUPPLEMENTS.slice(0, 4).map((supp, i) => (
                    <div key={i} className="supplement-card">
                      <div className="supplement-icon">{supp.icon}</div>
                      <div className="supplement-info">
                        <div className="supplement-name">{supp.name}</div>
                        <div className="supplement-desc">{supp.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {meals.map((meal, i) => (
                  <div key={i} className="meal-card">
                    <div className="meal-type">{meal.type}</div>
                    <div className="meal-name">{meal.name}</div>
                    <div className="meal-macros">
                      <span className="macro">{meal.calories} cal</span>
                      <span className="macro">Protein: {meal.protein}</span>
                      <span className="macro">Carbs: {meal.carbs}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="tab-content active">
            <h2 className="section-title">Your Progress</h2>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.workoutsDone}</div>
                <div className="stat-label">Workouts Done</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.totalWorkouts}</div>
                <div className="stat-label">Total Workouts</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.streak}</div>
                <div className="stat-label">Day Streak</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{profile.weight}kg</div>
                <div className="stat-label">Current Weight</div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>📊 Weekly Progress</h3>
              <div className="progress-section">
                <div className="progress-item">
                  <div className="progress-header">
                    <span>Workout Completion</span>
                    <span>{Math.round((stats.workoutsDone / Math.max(stats.totalWorkouts, 1)) * 100)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(stats.workoutsDone / Math.max(stats.totalWorkouts, 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="progress-item">
                  <div className="progress-header">
                    <span>Goal Progress</span>
                    <span>{profile.goal ? 'In Progress' : 'Set a goal'}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: profile.goal ? '25%' : '0%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>💊 Supplements to Consider</h3>
              {SUPPLEMENTS.map((supp, i) => (
                <div key={i} className="supplement-card">
                  <div className="supplement-icon">{supp.icon}</div>
                  <div className="supplement-info">
                    <div className="supplement-name">{supp.name}</div>
                    <div className="supplement-desc">{supp.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bottom-nav">
        {[
          { id: 'profile', icon: '👤', label: 'Profile' },
          { id: 'workouts', icon: '💪', label: 'Workouts' },
          { id: 'meals', icon: '🍽️', label: 'Meals' },
          { id: 'progress', icon: '📊', label: 'Progress' },
        ].map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {showAnalyzeModal && (
        <div className="analyze-modal">
          <div className="analyze-content">
            <div className="analyze-spinner" />
            <div className="analyze-title">Analyzing...</div>
            <div className="analyze-text">
              {activeTab === 'profile' 
                ? 'Analyzing your body type from photo...' 
                : 'Generating your personalized workout plan...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
