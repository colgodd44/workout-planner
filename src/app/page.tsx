'use client';

import { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const firebaseConfig = {
  apiKey: "AIzaSyDGFmqFLMiIypfHVsyiIlvPC_FXDhRayhY",
  authDomain: "workout-planner-b74e7.firebaseapp.com",
  projectId: "workout-planner-b74e7",
  storageBucket: "workout-planner-b74e7.firebasestorage.app",
  messagingSenderId: "266499388365",
  appId: "1:266499388365:web:cc42dc8a071dbad516ca84"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

interface ExerciseSet {
  weight: string;
  reps: string;
  completed: boolean;
}

interface ExerciseLog {
  name: string;
  sets: ExerciseSet[];
  notes: string;
  completed: boolean;
}

interface WorkoutLog {
  date: string;
  dayIndex: number;
  exercises: ExerciseLog[];
  duration: number;
  notes: string;
}

interface ProgressPhoto {
  id: string;
  dataUrl: string;
  date: string;
  week: string;
  notes: string;
  category: 'front' | 'side' | 'back' | 'other';
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

const EXERCISE_GUIDE: Record<string, { name: string; muscle: string; steps: string[]; tips: string[]; difficulty: string }> = {
  'bench press': {
    name: 'Bench Press',
    muscle: 'Chest, Shoulders, Triceps',
    steps: [
      'Lie flat on a bench with feet firmly on the ground',
      'Grip the bar slightly wider than shoulder-width apart',
      'Unrack the bar and hold it directly above your chest',
      'Lower the bar slowly to mid-chest, keeping elbows at 45 degrees',
      'Press the bar back up to the starting position',
      'Keep your core tight and back slightly arched throughout'
    ],
    tips: [
      'Warm up with lighter weights first',
      'Use a spotter for heavy lifts',
      'Keep wrists straight, not bent back'
    ],
    difficulty: 'Intermediate'
  },
  'squat': {
    name: 'Squat',
    muscle: 'Quadriceps, Glutes, Hamstrings',
    steps: [
      'Stand with feet shoulder-width apart, toes slightly pointed out',
      'Keep your chest up and core engaged',
      'Push your hips back as if sitting in a chair',
      'Lower until thighs are parallel to the ground',
      'Drive through your heels to stand back up',
      'Keep knees tracking over toes, not caving inward'
    ],
    tips: [
      'Start with bodyweight if new to squats',
      'Focus on form before adding weight',
      'Keep weight on your heels'
    ],
    difficulty: 'Beginner'
  },
  'deadlift': {
    name: 'Deadlift',
    muscle: 'Back, Glutes, Hamstrings, Core',
    steps: [
      'Stand with feet hip-width apart, bar over mid-foot',
      'Bend down and grip the bar just outside your legs',
      'Keep your back straight and chest up',
      'Drive through your heels, lifting the bar',
      'Stand up fully, squeezing your glutes at the top',
      'Lower the bar back down with control, hinging at hips'
    ],
    tips: [
      'Keep the bar close to your body',
      'Never round your lower back',
      'Start light to master form'
    ],
    difficulty: 'Intermediate'
  },
  'overhead press': {
    name: 'Overhead Press',
    muscle: 'Shoulders, Triceps',
    steps: [
      'Stand with feet shoulder-width apart',
      'Hold the bar at shoulder height, hands just outside shoulder width',
      'Brace your core and squeeze your glutes',
      'Press the bar straight up overhead',
      'Lock out your arms at the top',
      'Lower the bar back to shoulder height with control'
    ],
    tips: [
      'Avoid arching your back excessively',
      'Keep the bar moving in a straight line',
      'Engage your core throughout'
    ],
    difficulty: 'Intermediate'
  },
  'push-up': {
    name: 'Push-Up',
    muscle: 'Chest, Shoulders, Triceps, Core',
    steps: [
      'Start in a plank position with hands slightly wider than shoulders',
      'Keep your body in a straight line from head to heels',
      'Lower your chest to the ground, keeping elbows at 45 degrees',
      'Push back up to the starting position',
      'Keep your core tight throughout the movement'
    ],
    tips: [
      'Modify on knees if needed',
      'Focus on full range of motion',
      'Keep neck neutral, look at the floor'
    ],
    difficulty: 'Beginner'
  },
  'lunges': {
    name: 'Lunges',
    muscle: 'Quadriceps, Glutes, Hamstrings',
    steps: [
      'Stand with feet hip-width apart',
      'Step forward with one leg',
      'Lower your body until both knees are at 90 degrees',
      'Front knee should be directly over ankle',
      'Push back to the starting position',
      'Alternate legs or complete all reps on one side'
    ],
    tips: [
      'Keep your torso upright',
      'Take a big enough step to maintain balance',
      'Can do walking lunges or stationary'
    ],
    difficulty: 'Beginner'
  },
  'plank': {
    name: 'Plank',
    muscle: 'Core, Shoulders',
    steps: [
      'Start in a push-up position on your forearms',
      'Keep your body in a straight line from head to heels',
      'Engage your core and squeeze your glutes',
      'Hold the position without letting hips sag or rise',
      'Breathe steadily throughout'
    ],
    tips: [
      'Don\'t hold your breath',
      'Focus on core engagement, not just holding position',
      'Start with 20-30 second holds'
    ],
    difficulty: 'Beginner'
  },
  'pull-up': {
    name: 'Pull-Up',
    muscle: 'Back, Biceps, Shoulders',
    steps: [
      'Hang from a bar with hands slightly wider than shoulders',
      'Start from a dead hang with arms fully extended',
      'Pull your body up until chin is over the bar',
      'Keep your core tight and avoid swinging',
      'Lower yourself back down with control',
      'Fully extend arms at the bottom of each rep'
    ],
    tips: [
      'Use an assisted band if needed',
      'Focus on pulling with your back, not arms',
      'Can do chin-ups (palms toward you) as easier variation'
    ],
    difficulty: 'Intermediate'
  },
  'barbell row': {
    name: 'Barbell Row',
    muscle: 'Back, Biceps',
    steps: [
      'Stand with feet shoulder-width apart, holding a barbell',
      'Hinge forward at hips until torso is nearly parallel to ground',
      'Keep your back straight and core engaged',
      'Pull the bar to your lower chest/upper abdomen',
      'Squeeze your shoulder blades together at the top',
      'Lower the bar back down with control'
    ],
    tips: [
      'Keep your lower back neutral',
      'Pull with your elbows, not just hands',
      'Use a mixed grip for heavy weights'
    ],
    difficulty: 'Intermediate'
  },
  'bicep curl': {
    name: 'Bicep Curl',
    muscle: 'Biceps',
    steps: [
      'Stand with feet shoulder-width apart, dumbbells at sides',
      'Keep elbows close to your sides',
      'Curl the weights up toward your shoulders',
      'Squeeze at the top of the movement',
      'Lower slowly back to the starting position',
      'Keep your upper arms stationary'
    ],
    tips: [
      'Don\'t swing your body',
      'Control the negative portion of the rep',
      'Can do hammer curls (palms facing each other)'
    ],
    difficulty: 'Beginner'
  },
  'tricep pushdown': {
    name: 'Tricep Pushdown',
    muscle: 'Triceps',
    steps: [
      'Stand facing a cable machine with rope or bar attachment',
      'Grip the handle with hands shoulder-width apart',
      'Keep elbows pinned to your sides',
      'Push the handle down until arms are fully extended',
      'Squeeze your triceps at the bottom',
      'Return to starting position with control'
    ],
    tips: [
      'Keep upper arms stationary',
      'Don\'t lean forward excessively',
      'Focus on the triceps, not shoulders'
    ],
    difficulty: 'Beginner'
  },
  'leg press': {
    name: 'Leg Press',
    muscle: 'Quadriceps, Glutes, Hamstrings',
    steps: [
      'Sit in the leg press machine with back against the pad',
      'Place feet shoulder-width apart on the platform',
      'Release the safety handles',
      'Lower the platform by bending your knees',
      'Go down until knees are at 90 degrees',
      'Press through your heels to extend your legs'
    ],
    tips: [
      'Keep your lower back pressed against the pad',
      'Don\'t lock your knees at the top',
      'Start with a lighter weight to learn the movement'
    ],
    difficulty: 'Beginner'
  },
  'dumbbell shoulder press': {
    name: 'Dumbbell Shoulder Press',
    muscle: 'Shoulders, Triceps',
    steps: [
      'Sit on a bench with back support or stand',
      'Hold dumbbells at shoulder height, palms facing forward',
      'Press the weights up overhead until arms are extended',
      'Keep a slight bend in your elbows at the top',
      'Lower the dumbbells back to shoulder height slowly',
      'Maintain core engagement throughout'
    ],
    tips: [
      'Start with lighter dumbbells to master form',
      'Can be done seated or standing',
      'Keep core tight to avoid back arching'
    ],
    difficulty: 'Beginner'
  },
  'lateral raise': {
    name: 'Lateral Raise',
    muscle: 'Shoulders (Side Delt)',
    steps: [
      'Stand with dumbbells at your sides',
      'Keep a slight bend in your elbows',
      'Raise arms out to the sides until parallel with floor',
      'Keep palms facing down or toward each other',
      'Lower slowly back to starting position',
      'Avoid using momentum or swinging'
    ],
    tips: [
      'Use light weight to avoid shoulder strain',
      'Lead with your elbows, not hands',
      'Slight bend in elbows protects joints'
    ],
    difficulty: 'Beginner'
  },
  'romanian deadlift': {
    name: 'Romanian Deadlift',
    muscle: 'Hamstrings, Glutes, Lower Back',
    steps: [
      'Stand holding a barbell or dumbbells in front of you',
      'Keep a slight bend in your knees',
      'Hinge at your hips, pushing them back',
      'Lower the weight along your legs',
      'Feel a stretch in your hamstrings',
      'Drive hips forward to return to standing'
    ],
    tips: [
      'Keep the bar close to your legs',
      'Focus on the hip hinge movement',
      'Don\'t round your back'
    ],
    difficulty: 'Intermediate'
  },
  'leg curl': {
    name: 'Leg Curl',
    muscle: 'Hamstrings',
    steps: [
      'Lie face down on a leg curl machine',
      'Position the pad just above your heels',
      'Curl your heels toward your glutes',
      'Squeeze at the top of the movement',
      'Lower slowly back to starting position',
      'Keep your hips pressed to the pad'
    ],
    tips: [
      'Don\'t lift your hips off the pad',
      'Control the eccentric portion of the lift',
      'Point toes inward or outward to vary emphasis'
    ],
    difficulty: 'Beginner'
  },
  'calf raise': {
    name: 'Calf Raise',
    muscle: 'Calves',
    steps: [
      'Stand on a raised surface with heels hanging off',
      'Place hands on a wall or machine for balance',
      'Lower your heels below the platform level',
      'Rise up onto your toes as high as possible',
      'Squeeze your calves at the top',
      'Lower slowly back down'
    ],
    tips: [
      'Use a full range of motion',
      'Can do seated calf raises for different emphasis',
      'Hold the stretch at the bottom'
    ],
    difficulty: 'Beginner'
  },
  'burpee': {
    name: 'Burpee',
    muscle: 'Full Body Cardio',
    steps: [
      'Start standing with feet shoulder-width apart',
      'Squat down and place hands on the floor',
      'Jump feet back into a plank position',
      'Perform a push-up (optional)',
      'Jump feet back toward your hands',
      'Explosively jump up with arms overhead'
    ],
    tips: [
      'Modify by stepping back instead of jumping',
      'Keep core tight throughout',
      'Land softly to protect joints'
    ],
    difficulty: 'Intermediate'
  },
  'mountain climber': {
    name: 'Mountain Climber',
    muscle: 'Core, Shoulders, Cardio',
    steps: [
      'Start in a plank position',
      'Drive one knee toward your chest',
      'Quickly switch legs, extending the first leg back',
      'Continue alternating legs at a quick pace',
      'Keep your hips level, don\'t let them bounce',
      'Maintain a fast pace for cardio benefit'
    ],
    tips: [
      'Keep your core tight',
      'Move at a controlled but quick pace',
      'Look at the floor to maintain neck alignment'
    ],
    difficulty: 'Beginner'
  },
  'russian twist': {
    name: 'Russian Twist',
    muscle: 'Obliques, Core',
    steps: [
      'Sit with knees bent, feet on the floor',
      'Lean back slightly, keeping back straight',
      'Clasp hands together in front of you',
      'Rotate your torso to one side',
      'Return to center, then rotate to the other side',
      'Keep your core engaged throughout'
    ],
    tips: [
      'Lift feet for more challenge',
      'Move with control, not momentum',
      'Can add weight for resistance'
    ],
    difficulty: 'Beginner'
  },
  'bicycle crunch': {
    name: 'Bicycle Crunch',
    muscle: 'Abs, Obliques',
    steps: [
      'Lie on your back with hands behind your head',
      'Lift shoulders off the ground',
      'Bring one knee toward your opposite elbow',
      'Extend the other leg straight out',
      'Alternate sides in a pedaling motion',
      'Keep lower back pressed to the floor'
    ],
    tips: [
      'Focus on the twist, not just knee movement',
      'Don\'t pull on your neck',
      'Move at a controlled pace'
    ],
    difficulty: 'Beginner'
  },
  'glute bridge': {
    name: 'Glute Bridge',
    muscle: 'Glutes, Hamstrings',
    steps: [
      'Lie on your back with knees bent, feet flat on floor',
      'Keep feet hip-width apart, close to your glutes',
      'Drive through your heels to lift hips',
      'Squeeze your glutes at the top',
      'Your body should form a straight line from shoulders to knees',
      'Lower back down with control'
    ],
    tips: [
      'Don\'t push hips too high (no back arching)',
      'Can do single-leg for more challenge',
      'Hold at the top for 1-2 seconds'
    ],
    difficulty: 'Beginner'
  },
  'sumo squat': {
    name: 'Sumo Squat',
    muscle: 'Inner Thighs, Glutes, Quadriceps',
    steps: [
      'Stand with feet wider than shoulder-width apart',
      'Point toes out at about 45 degrees',
      'Keep your chest up and back straight',
      'Squat down, pushing knees out over toes',
      'Go down until thighs are parallel to ground',
      'Drive through heels to stand back up'
    ],
    tips: [
      'Keep knees tracking over toes',
      'Hold a dumbbell for added resistance',
      'Focus on pushing knees outward'
    ],
    difficulty: 'Beginner'
  },
  'wall sit': {
    name: 'Wall Sit',
    muscle: 'Quadriceps, Glutes',
    steps: [
      'Stand with your back against a wall',
      'Slide down until thighs are parallel to floor',
      'Keep knees at 90 degrees, directly over ankles',
      'Press your lower back into the wall',
      'Hold the position for the prescribed time',
      'Keep breathing steadily throughout'
    ],
    tips: [
      'Keep your back fully against the wall',
      'Engage your core',
      'Start with 20-30 seconds'
    ],
    difficulty: 'Beginner'
  },
  'jumping jack': {
    name: 'Jumping Jack',
    muscle: 'Full Body Cardio',
    steps: [
      'Stand with feet together, arms at sides',
      'Jump feet out to the sides',
      'Simultaneously raise arms overhead',
      'Jump feet back together',
      'Lower arms back to sides',
      'Repeat at a steady pace'
    ],
    tips: [
      'Land softly to protect joints',
      'Keep a steady rhythm',
      'Great for warm-up or cardio circuits'
    ],
    difficulty: 'Beginner'
  },
  'high knee': {
    name: 'High Knees',
    muscle: 'Hip Flexors, Core, Cardio',
    steps: [
      'Stand tall with feet hip-width apart',
      'Drive one knee up toward your chest',
      'Bring thigh parallel to the ground',
      'Quickly switch to the other leg',
      'Pump your arms in sync with your legs',
      'Keep your core tight throughout'
    ],
    tips: [
      'Stay on the balls of your feet',
      'Move at a quick, controlled pace',
      'Great for warming up or HIIT'
    ],
    difficulty: 'Beginner'
  },
  'skull crusher': {
    name: 'Skull Crusher',
    muscle: 'Triceps',
    steps: [
      'Lie on a flat bench holding a barbell or EZ bar',
      'Extend arms straight up, perpendicular to floor',
      'Keeping upper arms stationary, lower the weight',
      'Bend elbows to bring weight toward forehead',
      'Extend arms back to starting position',
      'Keep elbows pointed at the ceiling'
    ],
    tips: [
      'Use a spotter for heavy weights',
      'Control the descent carefully',
      'Can use dumbbells for better range of motion'
    ],
    difficulty: 'Intermediate'
  },
  'face pull': {
    name: 'Face Pull',
    muscle: 'Rear Deltoids, Upper Back',
    steps: [
      'Set a cable machine to face height with rope attachment',
      'Grip the rope with hands shoulder-width apart',
      'Pull the rope toward your face, past your ears',
      'Separate hands at the end, pulling elbows back',
      'Squeeze your shoulder blades together',
      'Return to starting position with control'
    ],
    tips: [
      'Great for shoulder health',
      'Keep core engaged',
      'Don\'t use too much weight'
    ],
    difficulty: 'Beginner'
  },
  'hammer curl': {
    name: 'Hammer Curl',
    muscle: 'Biceps, Forearms',
    steps: [
      'Stand with dumbbells at your sides, palms facing in',
      'Keep elbows close to your body',
      'Curl the weights up toward your shoulders',
      'Keep palms facing each other throughout',
      'Squeeze at the top',
      'Lower slowly back to starting position'
    ],
    tips: [
      'Keeps constant tension on biceps',
      'Don\'t swing your body',
      'Great for building forearm strength'
    ],
    difficulty: 'Beginner'
  },
  'front squat': {
    name: 'Front Squat',
    muscle: 'Quadriceps, Core',
    steps: [
      'Stand with feet shoulder-width apart',
      'Hold the barbell across the front of your shoulders',
      'Keep elbows high, wrists straight',
      'Squat down keeping torso upright',
      'Go until elbows are above knees',
      'Drive through heels to stand up'
    ],
    tips: [
      'Requires good mobility in wrists and shoulders',
      'Keep elbows high throughout',
      'Less weight than back squat typically'
    ],
    difficulty: 'Advanced'
  },
  'tricep dip': {
    name: 'Tricep Dip',
    muscle: 'Triceps, Chest, Shoulders',
    steps: [
      'Sit on the edge of a bench or chair',
      'Place hands beside your hips, fingers forward',
      'Slide off the edge, supporting your weight with arms',
      'Lower your body by bending elbows to 90 degrees',
      'Press back up to starting position',
      'Keep your back close to the bench'
    ],
    tips: [
      'For more challenge, extend legs forward',
      'Keep elbows pointed backward',
      'Control the descent'
    ],
    difficulty: 'Intermediate'
  },
  'incline bench press': {
    name: 'Incline Bench Press',
    muscle: 'Upper Chest, Shoulders, Triceps',
    steps: [
      'Set bench to 30-45 degree incline',
      'Lie back with bar directly above upper chest',
      'Grip bar slightly wider than shoulders',
      'Lower bar to upper chest',
      'Press bar back up to starting position',
      'Keep feet flat on the floor'
    ],
    tips: [
      'Don\'t set incline too steep',
      'Squeeze chest at the top',
      'Warm up with lighter weights'
    ],
    difficulty: 'Intermediate'
  },
  'dumbbell flye': {
    name: 'Dumbbell Flye',
    muscle: 'Chest',
    steps: [
      'Lie on a flat bench holding dumbbells above chest',
      'Keep a slight bend in your elbows',
      'Lower arms out to the sides in an arc',
      'Feel a stretch in your chest',
      'Bring arms back together above chest',
      'Maintain the slight elbow bend throughout'
    ],
    tips: [
      'Keep the bend consistent - don\'t straighten arms',
      'Control the movement',
      'Can be done on incline or decline too'
    ],
    difficulty: 'Beginner'
  },
  'preacher curl': {
    name: 'Preacher Curl',
    muscle: 'Biceps',
    steps: [
      'Sit at a preacher curl bench',
      'Rest your arms on the pad with arms extended',
      'Grip the bar or dumbbells',
      'Curl the weight up toward your shoulders',
      'Squeeze biceps at the top',
      'Lower slowly back to full extension'
    ],
    tips: [
      'Don\'t let your upper arms rise off the pad',
      'Full range of motion is key',
      'Great for isolating biceps'
    ],
    difficulty: 'Beginner'
  },
  'hack squat': {
    name: 'Hack Squat',
    muscle: 'Quadriceps, Glutes',
    steps: [
      'Stand in the hack squat machine with shoulders under pads',
      'Place feet shoulder-width on the platform',
      'Release the safety handles',
      'Lower your body by bending knees',
      'Keep your back pressed against the pad',
      'Push through your heels to stand up'
    ],
    tips: [
      'Keep your back against the pad',
      'Don\'t let knees cave inward',
      'Go to depth for full leg activation'
    ],
    difficulty: 'Intermediate'
  },
  't-bar row': {
    name: 'T-Bar Row',
    muscle: 'Back, Lats',
    steps: [
      'Straddle the T-bar with feet shoulder-width apart',
      'Bend at hips with flat back',
      'Grip the handle with both hands',
      'Pull the weight up to your chest',
      'Squeeze shoulder blades together',
      'Lower with control'
    ],
    tips: [
      'Keep back flat, not rounded',
      'Pull with your elbows, not hands',
      'Can use one arm at a time for variation'
    ],
    difficulty: 'Intermediate'
  },
  'seated cable row': {
    name: 'Seated Cable Row',
    muscle: 'Back, Biceps',
    steps: [
      'Sit at a cable row machine with feet on the platform',
      'Grip the handle with arms extended',
      'Keep back straight, slight bend in knees',
      'Pull handle to your abdomen',
      'Squeeze your shoulder blades together',
      'Extend arms back with control'
    ],
    tips: [
      'Keep your torso stationary',
      'Pull with your back, not arms',
      'Full stretch at the start of each rep'
    ],
    difficulty: 'Beginner'
  },
  'rear delt flye': {
    name: 'Rear Delt Flye',
    muscle: 'Rear Deltoids',
    steps: [
      'Bend forward at hips, holding dumbbells',
      'Let arms hang down with palms facing each other',
      'Raise arms out to the sides',
      'Keep a slight bend in elbows',
      'Squeeze shoulder blades at the top',
      'Lower slowly back to starting position'
    ],
    tips: [
      'Use light weight - rear delts are small',
      'Focus on the squeeze',
      'Great for shoulder balance'
    ],
    difficulty: 'Beginner'
  },
  'cable woodchop': {
    name: 'Cable Woodchop',
    muscle: 'Obliques, Core',
    steps: [
      'Stand sideways to a cable machine',
      'Hold the handle with both hands',
      'Pull the cable diagonally across your body',
      'Pivot your back foot and rotate your torso',
      'Bring hands down to opposite hip',
      'Return to starting position with control'
    ],
    tips: [
      'Use your core, not just arms',
      'Keep arms relatively straight',
      'Great for rotational strength'
    ],
    difficulty: 'Intermediate'
  },
  'leg extension': {
    name: 'Leg Extension',
    muscle: 'Quadriceps',
    steps: [
      'Sit in the leg extension machine',
      'Position the pad just above your ankles',
      'Extend your legs until straight',
      'Squeeze your quads at the top',
      'Lower slowly back to starting position',
      'Keep your back against the pad'
    ],
    tips: [
      'Don\'t lock knees at the top',
      'Control the descent',
      'Can do single leg for more challenge'
    ],
    difficulty: 'Beginner'
  },
  'leg raise': {
    name: 'Leg Raise',
    muscle: 'Lower Abs, Hip Flexors',
    steps: [
      'Lie flat on your back with legs extended',
      'Place hands under your lower back for support',
      'Lift legs up toward the ceiling',
      'Raise until legs are perpendicular to floor',
      'Lower slowly back down',
      'Keep legs straight throughout'
    ],
    tips: [
      'Keep lower back pressed to the floor',
      'Bend knees slightly if too hard',
      'For more challenge, add a hold at the top'
    ],
    difficulty: 'Intermediate'
  },
  'hanging leg raise': {
    name: 'Hanging Leg Raise',
    muscle: 'Lower Abs, Hip Flexors',
    steps: [
      'Hang from a pull-up bar with arms straight',
      'Engage your core',
      'Lift legs up until parallel to floor',
      'For more challenge, raise knees to chest',
      'Lower slowly back down',
      'Avoid swinging or using momentum'
    ],
    tips: [
      'Start with bent knees if straight legs are hard',
      'Control the movement',
      'Great for grip strength too'
    ],
    difficulty: 'Intermediate'
  },
  'dead bug': {
    name: 'Dead Bug',
    muscle: 'Core, Stability',
    steps: [
      'Lie on your back with arms extended up',
      'Lift legs with knees at 90 degrees, thighs vertical',
      'Lower one arm and opposite leg toward floor',
      'Keep lower back pressed to the ground',
      'Return to starting position',
      'Alternate sides with control'
    ],
    tips: [
      'Keep your lower back flat on the ground',
      'Move slowly and with control',
      'Great for core stability and lower back health'
    ],
    difficulty: 'Beginner'
  },
  'clamshell': {
    name: 'Clamshell',
    muscle: 'Glutes, Hip Abductors',
    steps: [
      'Lie on your side with knees bent at 90 degrees',
      'Keep feet together',
      'Open top knee away from bottom knee',
      'Rotate at the hip, not by rolling',
      'Squeeze at the top',
      'Lower slowly back to starting position'
    ],
    tips: [
      'Don\'t roll your hips back',
      'Keep feet together throughout',
      'Great for hip strength and injury prevention'
    ],
    difficulty: 'Beginner'
  },
  'goblet squat': {
    name: 'Goblet Squat',
    muscle: 'Quadriceps, Glutes',
    steps: [
      'Hold a dumbbell or kettlebell at chest level',
      'Stand with feet shoulder-width apart',
      'Squat down, keeping the weight at your chest',
      'Go down until elbows touch knees',
      'Keep your chest up throughout',
      'Drive through heels to stand back up'
    ],
    tips: [
      'The weight helps counterbalance',
      'Keep elbows inside your knees',
      'Great for learning squat form'
    ],
    difficulty: 'Beginner'
  },
  'arnold press': {
    name: 'Arnold Press',
    muscle: 'Shoulders',
    steps: [
      'Sit with dumbbells at shoulder height, palms facing you',
      'Rotate wrists so palms face forward',
      'Press dumbbells overhead as you rotate',
      'Finish with arms extended, palms facing forward',
      'Reverse the motion to return to start',
      'Keep core engaged throughout'
    ],
    tips: [
      'The rotation adds extra shoulder work',
      'Start with lighter weight to master form',
      'Keep the motion smooth'
    ],
    difficulty: 'Intermediate'
  },
  'cable flye': {
    name: 'Cable Flye',
    muscle: 'Chest',
    steps: [
      'Set cables at chest height on both sides',
      'Stand in the center with feet staggered',
      'Grip handles with arms extended out to sides',
      'Bring hands together in front of chest',
      'Squeeze chest at the center',
      'Return to starting position with control'
    ],
    tips: [
      'Keep a slight bend in elbows',
      'Full range of motion is key',
      'Constant tension unlike dumbbell flyes'
    ],
    difficulty: 'Beginner'
  },
  'walking lunge': {
    name: 'Walking Lunge',
    muscle: 'Quadriceps, Glutes, Balance',
    steps: [
      'Stand tall with feet hip-width apart',
      'Step forward with one leg',
      'Lower until both knees are at 90 degrees',
      'Push through front heel to bring back leg forward',
      'Continue forward, alternating legs',
      'Maintain upright torso throughout'
    ],
    tips: [
      'Take big enough steps',
      'Keep front knee over ankle',
      'Adds balance challenge to regular lunges'
    ],
    difficulty: 'Intermediate'
  },
  'jump squat': {
    name: 'Jump Squat',
    muscle: 'Quadriceps, Glutes, Power',
    steps: [
      'Stand with feet shoulder-width apart',
      'Perform a regular squat to 90 degrees',
      'Explosively jump up from the bottom',
      'Extend arms overhead during the jump',
      'Land softly on the balls of your feet',
      'Immediately go into the next squat'
    ],
    tips: [
      'Land softly to protect knees',
      'Start with regular squats if new to plyometrics',
      'Keep core engaged'
    ],
    difficulty: 'Intermediate'
  },
  'wide grip pull-up': {
    name: 'Wide Grip Pull-Up',
    muscle: 'Lats, Upper Back',
    steps: [
      'Hang from a bar with hands wider than shoulders',
      'Start from a dead hang',
      'Pull yourself up until chin is over the bar',
      'Focus on pulling elbows down and back',
      'Lower slowly back to dead hang',
      'Keep body straight, no swinging'
    ],
    tips: [
      'Wider grip emphasizes lats more',
      'Warm up shoulders first',
      'Can use assisted pull-up machine'
    ],
    difficulty: 'Advanced'
  },
  'seated leg curl': {
    name: 'Seated Leg Curl',
    muscle: 'Hamstrings',
    steps: [
      'Sit in the seated leg curl machine',
      'Position the pad just above your feet',
      'Curl your heels toward your glutes',
      'Squeeze hamstrings at the top',
      'Lower slowly back to starting position',
      'Keep back pressed against the seat'
    ],
    tips: [
      'Keep your hips square',
      'Control the negative portion',
      'Less stress on lower back than lying version'
    ],
    difficulty: 'Beginner'
  },
  'diamond push-up': {
    name: 'Diamond Push-Up',
    muscle: 'Triceps, Chest',
    steps: [
      'Start in push-up position',
      'Bring hands together under your chest',
      'Form a diamond shape with thumbs and index fingers',
      'Lower chest to your hands',
      'Push back up to starting position',
      'Keep core tight and body straight'
    ],
    tips: [
      'Targets triceps more than regular push-ups',
      'Modify on knees if needed',
      'Keep elbows close to body'
    ],
    difficulty: 'Intermediate'
  },
  'superman hold': {
    name: 'Superman Hold',
    muscle: 'Lower Back, Glutes',
    steps: [
      'Lie face down with arms extended forward',
      'Simultaneously lift arms, chest, and legs',
      'Hold at the top, squeezing glutes and back',
      'Reach arms toward your feet',
      'Keep neck neutral',
      'Hold for 2-3 seconds at the top'
    ],
    tips: [
      'Don\'t overextend your back',
      'Breathe normally while holding',
      'Great for lower back health'
    ],
    difficulty: 'Beginner'
  },
  'arm circle': {
    name: 'Arm Circle',
    muscle: 'Shoulders (Warm-up)',
    steps: [
      'Stand with arms extended to the sides at shoulder height',
      'Make small circles with your arms',
      'Gradually increase circle size',
      'After 10-15 reps, reverse direction',
      'Keep core engaged',
      'Maintain steady breathing'
    ],
    tips: [
      'Great for shoulder warm-up',
      'Don\'t make circles too big at first',
      'Do both forward and backward'
    ],
    difficulty: 'Beginner'
  },
  'foam rolling': {
    name: 'Foam Rolling (Recovery)',
    muscle: 'Myofascial Release',
    steps: [
      'Position the foam roller under the target muscle',
      'Slowly roll along the muscle',
      'Pause on tender points for 20-30 seconds',
      'Apply gentle pressure to release tension',
      'Avoid rolling directly on joints or bones',
      'Breathe deeply and relax into the pressure'
    ],
    tips: [
      'Never roll on injured areas',
      'Stop if you feel sharp pain',
      'Focus on IT band, quads, back, and calves'
    ],
    difficulty: 'Beginner'
  },
  'stretching': {
    name: 'Stretching',
    muscle: 'Flexibility',
    steps: [
      'Hold each stretch for 20-30 seconds',
      'Never bounce while stretching',
      'Stretch to the point of tension, not pain',
      'Breathe deeply and relax into each stretch',
      'Focus on major muscle groups',
      'Stretch both sides equally'
    ],
    tips: [
      'Never stretch cold muscles',
      'Dynamic stretching before workout',
      'Static stretching after workout'
    ],
    difficulty: 'Beginner'
  },
  'light walking': {
    name: 'Light Walking',
    muscle: 'Cardio, Active Recovery',
    steps: [
      'Walk at a comfortable pace',
      'Keep your head up and shoulders relaxed',
      'Swing arms naturally',
      'Maintain a steady rhythm',
      'Walk for 20-30 minutes',
      'Cool down with slower pace at end'
    ],
    tips: [
      'Great for rest days',
      'Aids recovery and blood flow',
      'Keep pace easy enough to talk'
    ],
    difficulty: 'Beginner'
  },
  'gentle yoga': {
    name: 'Gentle Yoga',
    muscle: 'Flexibility, Mindfulness',
    steps: [
      'Find a quiet space with room to move',
      'Start with basic poses (Downward Dog, Child\'s Pose)',
      'Move slowly through each pose',
      'Focus on breath and body awareness',
      'Hold poses for 30-60 seconds',
      'End with relaxation poses'
    ],
    tips: [
      'Don\'t force any position',
      'Listen to your body',
      'Great for recovery and flexibility'
    ],
    difficulty: 'Beginner'
  },
  'jump rope': {
    name: 'Jump Rope',
    muscle: 'Cardio, Calves, Coordination',
    steps: [
      'Hold rope handles in each hand',
      'Jump with both feet slightly apart',
      'Turn rope with wrists, not arms',
      'Keep jumps low, just clearing the rope',
      'Land softly on the balls of your feet',
      'Start slow, increase speed as you improve'
    ],
    tips: [
      'Focus on quick wrist movements',
      'Keep elbows close to body',
      'Great for cardio and coordination'
    ],
    difficulty: 'Beginner'
  },
  'light jogging': {
    name: 'Light Jogging',
    muscle: 'Cardio, Legs',
    steps: [
      'Start with a brisk walk',
      'Gradually increase to a comfortable jogging pace',
      'Keep posture upright with slight forward lean',
      'Land mid-foot, not on your heels',
      'Swing arms naturally',
      'Keep a pace where you can still talk'
    ],
    tips: [
      'Warm up with walking first',
      'Keep core engaged',
      'Breathe rhythmically'
    ],
    difficulty: 'Beginner'
  },
  'sprint in place': {
    name: 'Sprint in Place',
    muscle: 'Cardio, Leg Power',
    steps: [
      'Stand tall with feet hip-width apart',
      'Drive knees up high, alternating quickly',
      'Pump arms in sync with legs',
      'Move at maximum effort',
      'Rest during the rest periods',
      'Maintain good posture throughout'
    ],
    tips: [
      'Go all out during work periods',
      'Keep core tight',
      'Great for HIIT workouts'
    ],
    difficulty: 'Intermediate'
  },
  'squat to press': {
    name: 'Squat to Press',
    muscle: 'Full Body',
    steps: [
      'Stand holding dumbbells at shoulders',
      'Perform a squat',
      'As you stand up, press dumbbells overhead',
      'Finish with arms extended overhead',
      'Lower dumbbells back to shoulders',
      'Repeat with control'
    ],
    tips: [
      'Combines lower and upper body work',
      'Full body movement - great for efficiency',
      'Keep core engaged throughout'
    ],
    difficulty: 'Intermediate'
  },
  'plank shoulder tap': {
    name: 'Plank Shoulder Tap',
    muscle: 'Core, Shoulders',
    steps: [
      'Start in a plank position',
      'Keep hips stable while lifting one hand',
      'Tap opposite shoulder',
      'Return hand to floor',
      'Repeat with other hand',
      'Keep hips from rotating'
    ],
    tips: [
      'Keep core tight to prevent hip rotation',
      'Go slower for more challenge',
      'Great for core stability'
    ],
    difficulty: 'Intermediate'
  },
  'tricep kickback': {
    name: 'Tricep Kickback',
    muscle: 'Triceps',
    steps: [
      'Bend forward at hips holding dumbbell',
      'Keep upper arm parallel to floor',
      'Extend arm straight back',
      'Squeeze triceps at the top',
      'Lower back to starting position',
      'Keep elbow stationary throughout'
    ],
    tips: [
      'Focus on the tricep, not the back',
      'Can do one arm at a time',
      'Keep core engaged'
    ],
    difficulty: 'Beginner'
  },
  'bent over row': {
    name: 'Bent Over Row',
    muscle: 'Back, Biceps',
    steps: [
      'Hold dumbbells in front of you',
      'Bend at hips, keeping back flat',
      'Let arms hang straight down',
      'Pull dumbbells to your sides',
      'Squeeze shoulder blades together',
      'Lower with control'
    ],
    tips: [
      'Keep back straight, not rounded',
      'Pull with elbows, not hands',
      'Can do alternating or together'
    ],
    difficulty: 'Beginner'
  },
  'leg lift': {
    name: 'Leg Lift',
    muscle: 'Lower Abs, Hip Flexors',
    steps: [
      'Lie on your back with legs extended',
      'Place hands under your glutes for support',
      'Lift legs to 90 degrees',
      'Lower slowly back down',
      'Keep lower back pressed to floor',
      'Full range of motion'
    ],
    tips: [
      'Keep legs straight',
      'Don\'t let lower back arch',
      'For more challenge, hold at top'
    ],
    difficulty: 'Beginner'
  },
  'brisk walk': {
    name: 'Brisk Walk/Jog',
    muscle: 'Cardio',
    steps: [
      'Start at a comfortable walking pace',
      'Gradually increase to brisk walking or light jog',
      'Maintain steady breathing',
      'Keep good posture',
      'Swing arms naturally',
      'Cool down with slower pace'
    ],
    tips: [
      'Keep a pace where you can still hold a conversation',
      'Great for steady state cardio',
      'Good for active recovery days'
    ],
    difficulty: 'Beginner'
  },
  'push-up to renegade row': {
    name: 'Push-Up to Renegade Row',
    muscle: 'Chest, Back, Core',
    steps: [
      'Start in push-up position with dumbbells',
      'Perform a push-up while holding dumbbells',
      'Row one dumbbell to your hip',
      'Lower it back down',
      'Repeat on other side',
      'Alternate sides'
    ],
    tips: [
      'Keep core tight throughout',
      'Great compound movement',
      'Start without dumbbells if needed'
    ],
    difficulty: 'Advanced'
  },
  'rest': {
    name: 'Rest',
    muscle: 'Recovery',
    steps: [
      'Take it easy during this period',
      'Hydrate well',
      'Focus on breathing',
      'Allow muscles to recover',
      'Stay loose with light movement if needed',
      'Prepare for next set'
    ],
    tips: [
      'Active rest is better than sitting still',
      'Hydration is key',
      'Use this time mentally to prepare'
    ],
    difficulty: 'Beginner'
  },
};

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
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [exerciseLogs, setExerciseLogs] = useState<WorkoutLog[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [restTimerRunning, setRestTimerRunning] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(90);
  const [restTimerDefault, setRestTimerDefault] = useState(90);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [voiceInput, setVoiceInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [photoCategory, setPhotoCategory] = useState<'front' | 'side' | 'back' | 'other' | 'all'>('front');
  const [photoNotes, setPhotoNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleSignUp = async () => {
    try {
      setAuthError('');
      await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleSignIn = async () => {
    try {
      setAuthError('');
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  const saveAllData = async (uid: string) => {
    try {
      await setDoc(doc(db, 'users', uid), {
        profile,
        completedDays,
        exerciseLogs,
        progressPhotos,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error('Error saving data:', err);
    }
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const loadUserData = async () => {
          try {
            const docRef = doc(db, 'users', firebaseUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.profile) setProfile(data.profile);
              if (data.completedDays) setCompletedDays(data.completedDays);
              if (data.exerciseLogs) setExerciseLogs(data.exerciseLogs);
              if (data.progressPhotos) setProgressPhotos(data.progressPhotos);
              localStorage.setItem('workout-profile', JSON.stringify(data.profile || {}));
              localStorage.setItem('workout-completed', JSON.stringify(data.completedDays || []));
              localStorage.setItem('workout-logs', JSON.stringify(data.exerciseLogs || []));
              localStorage.setItem('progress-photos', JSON.stringify(data.progressPhotos || []));
            }
          } catch (err) {
            console.error('Error loading user data:', err);
          }
        };
        loadUserData();
      }
      setAuthLoading(false);
    });
    
    timeout = setTimeout(() => {
      setAuthLoading(false);
    }, 5000);
    
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

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
    const savedLogs = localStorage.getItem('workout-logs');
    if (savedLogs) {
      setExerciseLogs(JSON.parse(savedLogs));
    }
    const savedPhotos = localStorage.getItem('progress-photos');
    if (savedPhotos) {
      setProgressPhotos(JSON.parse(savedPhotos));
    }
  }, []);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  useEffect(() => {
    if (restTimerRunning) {
      restTimerRef.current = setInterval(() => {
        setRestTimerSeconds(prev => {
          if (prev <= 1) {
            setRestTimerRunning(false);
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('Rest complete!', { body: 'Time for your next set!' });
            }
            return restTimerDefault;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [restTimerRunning, restTimerDefault]);

  const startRestTimer = (seconds?: number) => {
    if (seconds) {
      setRestTimerDefault(seconds);
      setRestTimerSeconds(seconds);
    } else {
      setRestTimerSeconds(restTimerDefault);
    }
    setRestTimerRunning(true);
  };

  const stopRestTimer = () => {
    setRestTimerRunning(false);
    setRestTimerSeconds(restTimerDefault);
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser');
      return;
    }
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setVoiceInput(transcript);
      setIsListening(false);
      processVoiceCommand(transcript);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  const processVoiceCommand = (text: string) => {
    const patterns = [
      { regex: /(\d+)\s*(?:sets?|x)\s*(\d+)\s*(?:reps?)?\s*(?:of\s+)?(.+)/i, sets: 1, reps: 2, name: 3 },
      { regex: /(\d+)\s*(?:reps?)\s*(?:of\s+)?(.+)/i, sets: 1, reps: 1, name: 2 },
      { regex: /(.+)\s*(\d+)\s*(?:x|by)\s*(\d+)/i, sets: 3, reps: 2, name: 1 },
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        const sets = parseInt(match[pattern.sets]) || 1;
        const reps = parseInt(match[pattern.reps]) || 10;
        const exerciseName = match[pattern.name].trim();
        console.log(`Voice command: ${sets} sets of ${reps} reps of ${exerciseName}`);
        alert(`Voice input processed!\n${sets} sets × ${reps} reps of ${exerciseName}`);
        return;
      }
    }
    alert(`Couldn't understand: "${text}". Try something like "3 sets of 10 squats"`);
  };

  const saveProfile = (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    localStorage.setItem('workout-profile', JSON.stringify(newProfile));
  };

  const saveCompletedDays = (days: number[]) => {
    setCompletedDays(days);
    localStorage.setItem('workout-completed', JSON.stringify(days));
  };

  const saveExerciseLogs = (logs: WorkoutLog[]) => {
    setExerciseLogs(logs);
    localStorage.setItem('workout-logs', JSON.stringify(logs));
  };

  const saveProgressPhotos = (photos: ProgressPhoto[]) => {
    setProgressPhotos(photos);
    localStorage.setItem('progress-photos', JSON.stringify(photos));
  };

  const calculateWeekNumber = (date: string) => {
    const start = new Date(profile.createdAt || date);
    const current = new Date(date);
    const diff = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
    return `Week ${diff + 1}`;
  };

  const handleAddPhoto = (dataUrl: string) => {
    const today = new Date().toISOString().split('T')[0];
    const newPhoto: ProgressPhoto = {
      id: Date.now().toString(),
      dataUrl,
      date: today,
      week: calculateWeekNumber(today),
      notes: photoNotes,
      category: photoCategory === 'all' ? 'front' : photoCategory
    };
    saveProgressPhotos([...progressPhotos, newPhoto]);
    setPhotoNotes('');
    setShowPhotoModal(false);
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleAddPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const deletePhoto = (id: string) => {
    if (confirm('Delete this photo?')) {
      saveProgressPhotos(progressPhotos.filter(p => p.id !== id));
      setSelectedPhoto(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startWorkout = (dayIndex: number) => {
    setActiveDay(dayIndex);
    setTimerRunning(true);
    setTimerSeconds(0);
    setWorkoutStartTime(Date.now());
  };

  const endWorkout = () => {
    setTimerRunning(false);
    if (activeDay !== null && workoutStartTime) {
      const duration = Math.floor((Date.now() - workoutStartTime) / 1000);
      const today = new Date().toISOString().split('T')[0];
      const existingLog = exerciseLogs.find(l => l.dayIndex === activeDay && l.date === today);
      
      if (!existingLog) {
        const workouts = profile.goal ? WORKOUTS_BY_GOAL[profile.goal] : [];
        const dayWorkout = workouts[activeDay];
        const newLog: WorkoutLog = {
          date: today,
          dayIndex: activeDay,
          exercises: dayWorkout.exercises.map(ex => ({
            name: ex.name,
            sets: Array.from({ length: parseInt(ex.sets.split('x')[0]) || 3 }, () => ({
              weight: '',
              reps: '',
              completed: false
            })),
            notes: '',
            completed: false
          })),
          duration: timerSeconds,
          notes: ''
        };
        saveExerciseLogs([...exerciseLogs, newLog]);
      }
    }
    setActiveDay(null);
  };

  const updateExerciseSet = (exerciseName: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    const today = new Date().toISOString().split('T')[0];
    const updatedLogs = exerciseLogs.map(log => {
      if (log.date === today && log.dayIndex === activeDay) {
        return {
          ...log,
          exercises: log.exercises.map(ex => {
            if (ex.name === exerciseName) {
              const newSets = [...ex.sets];
              newSets[setIndex] = { ...newSets[setIndex], [field]: value };
              return { ...ex, sets: newSets };
            }
            return ex;
          })
        };
      }
      return log;
    });
    saveExerciseLogs(updatedLogs);
  };

  const toggleSetComplete = (exerciseName: string, setIndex: number) => {
    const today = new Date().toISOString().split('T')[0];
    let setWasCompleted = false;
    const updatedLogs = exerciseLogs.map(log => {
      if (log.date === today && log.dayIndex === activeDay) {
        return {
          ...log,
          exercises: log.exercises.map(ex => {
            if (ex.name === exerciseName) {
              const newSets = [...ex.sets];
              const wasCompletingNow = !newSets[setIndex].completed;
              newSets[setIndex] = { ...newSets[setIndex], completed: !newSets[setIndex].completed };
              if (wasCompletingNow) setWasCompleted = true;
              const allCompleted = newSets.every(s => s.completed);
              return { ...ex, sets: newSets, completed: allCompleted };
            }
            return ex;
          })
        };
      }
      return log;
    });
    saveExerciseLogs(updatedLogs);
    if (setWasCompleted && !restTimerRunning) {
      startRestTimer();
    }
  };

  const getTodayLog = () => {
    const today = new Date().toISOString().split('T')[0];
    return exerciseLogs.find(l => l.date === today && l.dayIndex === activeDay);
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
        {user ? (
          <button 
            onClick={handleSignOut}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            Sign Out
          </button>
        ) : (
          <button 
            onClick={() => { setShowAuthModal(true); setAuthMode('signin'); }}
            style={{
              background: 'var(--accent)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600
            }}
          >
            Sign In
          </button>
        )}
      </div>

      {authLoading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, padding: 40 }}>
          <div className="analyze-spinner" style={{ width: 60, height: 60 }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      ) : !user ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 64 }}>🔐</div>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>Welcome to FitAI</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, maxWidth: 300 }}>
            Sign in to save your workout data securely in the cloud and access it from any device.
          </p>
          <button 
            onClick={() => { setShowAuthModal(true); setAuthMode('signup'); }}
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--pink))',
              border: 'none',
              color: 'white',
              padding: '16px 32px',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Get Started - It's Free
          </button>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Already have an account?{' '}
            <span 
              onClick={() => { setShowAuthModal(true); setAuthMode('signin'); }}
              style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
            >
              Sign In
            </span>
          </p>
        </div>
      ) : (
      <>
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
            
            {showWorkouts && (
              <button
                onClick={startVoiceInput}
                style={{
                  width: '100%',
                  padding: 12,
                  background: isListening ? 'var(--accent)' : 'var(--bg-card)',
                  border: `2px solid ${isListening ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 12,
                  color: 'white',
                  fontSize: 14,
                  cursor: 'pointer',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  animation: isListening ? 'pulse 1s infinite' : 'none'
                }}
              >
                <span style={{ fontSize: 20 }}>{isListening ? '🎤' : '🎙️'}</span>
                {isListening ? 'Listening...' : 'Voice Input: "3 sets of 10 squats"'}
              </button>
            )}
            
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
                      className={`weekday ${completedDays.includes(i) ? 'completed' : ''} ${activeDay === i ? 'active' : ''}`}
                      onClick={() => {
                        if (activeDay === i) {
                          endWorkout();
                        } else {
                          startWorkout(i);
                        }
                      }}
                    >
                      {completedDays.includes(i) ? '✓' : i + 1}
                    </div>
                  ))}
                </div>

                {activeDay !== null && (
                  <div className="card" style={{ background: 'linear-gradient(135deg, var(--accent), var(--pink))', marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, opacity: 0.9 }}>Workout Timer</div>
                        <div style={{ fontSize: 32, fontWeight: 800 }}>{formatTime(timerSeconds)}</div>
                      </div>
                      <button 
                        onClick={endWorkout}
                        style={{ 
                          background: 'rgba(255,255,255,0.2)', 
                          border: 'none', 
                          color: 'white', 
                          padding: '12px 24px', 
                          borderRadius: 12, 
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Finish Workout
                      </button>
                    </div>
                  </div>
                )}

                {restTimerRunning && (
                  <div className="card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', marginBottom: 20, position: 'sticky', top: 60, zIndex: 50 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, opacity: 0.9 }}>Rest Timer</div>
                        <div style={{ fontSize: 48, fontWeight: 800 }}>{formatTime(restTimerSeconds)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[60, 90, 120, 180].map(sec => (
                          <button
                            key={sec}
                            onClick={() => { setRestTimerDefault(sec); setRestTimerSeconds(sec); }}
                            style={{
                              background: restTimerDefault === sec ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                              border: 'none',
                              color: 'white',
                              padding: '8px 12px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              fontSize: 12
                            }}
                          >
                            {sec}s
                          </button>
                        ))}
                        <button 
                          onClick={stopRestTimer}
                          style={{ 
                            background: 'rgba(239, 68, 68, 0.8)', 
                            border: 'none', 
                            color: 'white', 
                            padding: '8px 16px', 
                            borderRadius: 8, 
                            cursor: 'pointer'
                          }}
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {workouts.map((workout, i) => {
                  const today = new Date().toISOString().split('T')[0];
                  const todayLog = exerciseLogs.find(l => l.date === today && l.dayIndex === i);
                  const allExercisesComplete = todayLog?.exercises.every(ex => ex.completed);
                  
                  return (
                    <div key={i} className="workout-card" style={{ 
                      borderLeftColor: allExercisesComplete ? 'var(--success)' : (activeDay === i ? 'var(--warning)' : 'var(--accent)'),
                      opacity: activeDay !== null && activeDay !== i ? 0.5 : 1,
                      pointerEvents: activeDay !== null && activeDay !== i ? 'none' : 'auto'
                    }}>
                      <div className="workout-day">{workout.day}</div>
                      <div className="workout-title">{workout.title}</div>
                      
                      {activeDay === i && todayLog && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                            Today's Progress: {todayLog.exercises.filter(e => e.completed).length}/{todayLog.exercises.length} exercises
                          </div>
                        </div>
                      )}
                      
                      <ul className="workout-exercises">
                        {workout.exercises.map((ex, j) => {
                          const exerciseKey = ex.name.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
                          const hasGuide = EXERCISE_GUIDE[exerciseKey] || EXERCISE_GUIDE[exerciseKey.split(' ')[0]] || EXERCISE_GUIDE[exerciseKey.split(' ').slice(-1)[0]];
                          const numSets = parseInt(ex.sets.split('x')[0]) || 3;
                          const todayLog = activeDay === i ? getTodayLog() : null;
                          const exerciseLog = todayLog?.exercises.find(e => e.name === ex.name);
                          
                          return (
                            <li 
                              key={j} 
                              className="workout-exercise"
                              style={{ flexDirection: 'column', alignItems: 'flex-start', gap: activeDay === i ? 12 : 0 }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span className="exercise-name">{ex.name}</span>
                                  <button
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      const guide = EXERCISE_GUIDE[exerciseKey] || EXERCISE_GUIDE[exerciseKey.split(' ')[0]] || EXERCISE_GUIDE[exerciseKey.split(' ').slice(-1)[0]] || Object.values(EXERCISE_GUIDE).find(g => exerciseKey.includes(g.name.toLowerCase().split(' ')[0]));
                                      if (guide) setSelectedExercise(guide.name);
                                    }}
                                    style={{
                                      background: 'var(--bg-secondary)',
                                      border: 'none',
                                      borderRadius: 6,
                                      padding: '4px 8px',
                                      fontSize: 12,
                                      color: 'var(--text-muted)',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    ℹ️
                                  </button>
                                </div>
                                <span className="exercise-sets">{ex.sets}</span>
                              </div>
                              
                              {activeDay === i && (
                                <div 
                                  style={{ width: '100%', background: 'var(--bg-secondary)', borderRadius: 12, padding: 12 }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                                    Set {numSets > 1 ? `1-${numSets}` : '1'} - Enter weight/reps
                                  </div>
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {Array.from({ length: numSets }).map((_, setIdx) => (
                                      <div key={setIdx} style={{ 
                                        display: 'flex', 
                                        gap: 4, 
                                        alignItems: 'center',
                                        background: exerciseLog?.sets[setIdx]?.completed ? 'var(--success)' : 'var(--bg-card)',
                                        padding: '8px 12px',
                                        borderRadius: 8
                                      }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 16 }}>{setIdx + 1}</span>
                                        <input
                                          type="number"
                                          placeholder="kg"
                                          inputMode="decimal"
                                          value={exerciseLog?.sets[setIdx]?.weight || ''}
                                          onChange={(e) => updateExerciseSet(ex.name, setIdx, 'weight', e.target.value)}
                                          onClick={(e) => e.stopPropagation()}
                                          onPointerDown={(e) => e.stopPropagation()}
                                          style={{ 
                                            width: 50, 
                                            background: 'transparent', 
                                            border: 'none', 
                                            color: 'white', 
                                            fontSize: 14,
                                            textAlign: 'center',
                                            outline: 'none',
                                            padding: 0,
                                            WebkitAppearance: 'none',
                                            MozAppearance: 'textfield'
                                          }}
                                        />
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>×</span>
                                        <input
                                          type="number"
                                          placeholder="reps"
                                          inputMode="numeric"
                                          value={exerciseLog?.sets[setIdx]?.reps || ''}
                                          onChange={(e) => updateExerciseSet(ex.name, setIdx, 'reps', e.target.value)}
                                          onClick={(e) => e.stopPropagation()}
                                          onPointerDown={(e) => e.stopPropagation()}
                                          style={{ 
                                            width: 40, 
                                            background: 'transparent', 
                                            border: 'none', 
                                            color: 'white', 
                                            fontSize: 14,
                                            textAlign: 'center',
                                            outline: 'none',
                                            padding: 0,
                                            WebkitAppearance: 'none',
                                            MozAppearance: 'textfield'
                                          }}
                                        />
                                        <button
                                          onClick={(e) => { e.stopPropagation(); toggleSetComplete(ex.name, setIdx); }}
                                          onTouchEnd={(e) => {
                                            const touch = e.changedTouches[0];
                                            const diffX = touch.clientX - (e.target as any).startX;
                                            if (Math.abs(diffX) > 50) {
                                              e.stopPropagation();
                                              toggleSetComplete(ex.name, setIdx);
                                            }
                                          }}
                                          onTouchStart={(e) => {
                                            const touch = e.touches[0];
                                            (e.target as any).startX = touch.clientX;
                                          }}
                                          style={{ 
                                            width: 28, 
                                            height: 28, 
                                            borderRadius: '50%', 
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            background: exerciseLog?.sets[setIdx]?.completed ? 'var(--success)' : 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 12,
                                            color: 'white',
                                            padding: 0,
                                            marginLeft: 4
                                          }}
                                        >
                                          {exerciseLog?.sets[setIdx]?.completed ? '✓' : ''}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
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
              <div className="stat-card">
                <div className="stat-value">{exerciseLogs.length}</div>
                <div className="stat-label">Sessions Logged</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {exerciseLogs.reduce((acc, log) => acc + log.duration, 0) > 0 
                    ? formatTime(exerciseLogs.reduce((acc, log) => acc + log.duration, 0))
                    : '0:00'}
                </div>
                <div className="stat-label">Total Time</div>
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

            {exerciseLogs.length > 0 && (
              <div className="card">
                <h3 style={{ fontSize: 16, marginBottom: 12 }}>📝 Recent Sessions</h3>
                {exerciseLogs.slice(-5).reverse().map((log, i) => (
                  <div key={i} style={{ 
                    background: 'var(--bg-secondary)', 
                    borderRadius: 12, 
                    padding: 12, 
                    marginBottom: 8 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600 }}>Day {log.dayIndex + 1}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{log.date}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span>⏱️ {formatTime(log.duration)}</span>
                      <span>✅ {log.exercises.filter(e => e.completed).length}/{log.exercises.length} exercises</span>
                    </div>
                    {log.exercises.filter(e => e.completed).length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                        {log.exercises.filter(e => e.completed).slice(0, 3).map((ex, j) => (
                          <span key={j} style={{ 
                            background: 'var(--bg-card)', 
                            padding: '2px 8px', 
                            borderRadius: 4, 
                            marginRight: 4 
                          }}>
                            {ex.name}: {ex.sets.filter(s => s.weight && s.reps).map(s => `${s.weight}kg×${s.reps}`).join(', ') || 'completed'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {exerciseLogs.length > 0 && (
              <div className="card">
                <h3 style={{ fontSize: 16, marginBottom: 16 }}>📈 Progress Charts</h3>
                
                {(() => {
                  const chartData = exerciseLogs.slice(-14).map((log, i) => ({
                    date: log.date.slice(5),
                    duration: Math.round(log.duration / 60),
                    exercises: log.exercises.filter(e => e.completed).length,
                  }));
                  
                  if (chartData.length > 1) {
                    return (
                      <>
                        <div style={{ marginBottom: 24 }}>
                          <h4 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-secondary)' }}>Workout Duration (minutes)</h4>
                          <ResponsiveContainer width="100%" height={150}>
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                              <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={10} />
                              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} />
                              <Tooltip 
                                contentStyle={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: 8 }}
                                labelStyle={{ color: 'white' }}
                              />
                              <Line type="monotone" dataKey="duration" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div style={{ marginBottom: 24 }}>
                          <h4 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-secondary)' }}>Exercises Completed</h4>
                          <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                              <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={10} />
                              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} />
                              <Tooltip 
                                contentStyle={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: 8 }}
                                labelStyle={{ color: 'white' }}
                              />
                              <Bar dataKey="exercises" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </>
                    );
                  }
                  return <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Complete more workouts to see charts!</p>;
                })()}
              </div>
            )}

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

        {activeTab === 'gallery' && (
          <div className="tab-content active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Progress Gallery</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowPhotoModal(true)}
                style={{ padding: '10px 16px' }}
              >
                📷 Add Photo
              </button>
            </div>

            {progressPhotos.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📸</div>
                <h3 style={{ marginBottom: 8 }}>No Progress Photos Yet</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Track your fitness journey by taking weekly photos to see your progress over time.
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowPhotoModal(true)}
                >
                  Take Your First Photo
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    {progressPhotos.length} photo{progressPhotos.length !== 1 ? 's' : ''} • {progressPhotos.length > 1 ? `${progressPhotos.length} weeks of progress` : 'Keep snapping weekly!'}
                  </div>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                    {['front', 'side', 'back', 'other'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setPhotoCategory(cat as any)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 20,
                          border: 'none',
                          background: photoCategory === cat ? 'var(--accent)' : 'var(--bg-card)',
                          color: 'white',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          textTransform: 'capitalize'
                        }}
                      >
                        {cat === 'front' ? '👤' : cat === 'side' ? '↔️' : cat === 'back' ? '👤‍🦯' : '📷'} {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                  {progressPhotos
                    .filter(p => photoCategory === 'all' || p.category === photoCategory)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(photo => (
                      <div 
                        key={photo.id}
                        onClick={() => setSelectedPhoto(photo)}
                        style={{
                          position: 'relative',
                          aspectRatio: '3/4',
                          borderRadius: 12,
                          overflow: 'hidden',
                          cursor: 'pointer'
                        }}
                      >
                        <img 
                          src={photo.dataUrl} 
                          alt={photo.date}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                          padding: '20px 8px 8px',
                          fontSize: 11
                        }}>
                          <div style={{ fontWeight: 600 }}>{photo.week}</div>
                          <div style={{ color: 'rgba(255,255,255,0.7)' }}>{photo.date}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="bottom-nav">
        {[
          { id: 'profile', icon: '👤', label: 'Profile' },
          { id: 'workouts', icon: '💪', label: 'Workouts' },
          { id: 'meals', icon: '🍽️', label: 'Meals' },
          { id: 'progress', icon: '📊', label: 'Progress' },
          { id: 'gallery', icon: '📸', label: 'Gallery' },
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

      {selectedExercise && (() => {
        const guide = Object.values(EXERCISE_GUIDE).find(g => g.name === selectedExercise);
        if (!guide) return null;
        return (
          <div className="analyze-modal" onClick={() => setSelectedExercise(null)}>
            <div className="analyze-content" style={{ maxWidth: '90%', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{guide.name}</h3>
                <button 
                  onClick={() => setSelectedExercise(null)}
                  style={{ 
                    background: 'var(--bg-card)', 
                    border: 'none', 
                    color: 'white', 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    cursor: 'pointer',
                    fontSize: 18
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <span style={{ background: 'var(--accent)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                  {guide.difficulty}
                </span>
                <span style={{ background: 'var(--success)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                  {guide.muscle}
                </span>
              </div>
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 16, marginBottom: 12, color: 'var(--accent)' }}>How to perform:</h4>
                <ol style={{ paddingLeft: 20, margin: 0 }}>
                  {guide.steps.map((step, i) => (
                    <li key={i} style={{ marginBottom: 10, fontSize: 14, lineHeight: 1.5 }}>{step}</li>
                  ))}
                </ol>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12 }}>
                <h4 style={{ fontSize: 16, marginBottom: 10, color: 'var(--warning)' }}>💡 Tips:</h4>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {guide.tips.map((tip, i) => (
                    <li key={i} style={{ marginBottom: 8, fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)' }}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })()}

      {showPhotoModal && (
        <div className="analyze-modal" onClick={() => setShowPhotoModal(false)}>
          <div className="analyze-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📷 Add Progress Photo</h3>
              <button 
                onClick={() => setShowPhotoModal(false)}
                style={{ 
                  background: 'var(--bg-card)', 
                  border: 'none', 
                  color: 'white', 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  cursor: 'pointer',
                  fontSize: 18
                }}
              >
                ×
              </button>
            </div>
            
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Take a photo in the same pose each week to track your progress!
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'block' }}>Photo Type:</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'front', icon: '👤', label: 'Front' },
                  { id: 'side', icon: '↔️', label: 'Side' },
                  { id: 'back', icon: '👤‍🦯', label: 'Back' },
                  { id: 'other', icon: '📷', label: 'Other' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setPhotoCategory(cat.id as any)}
                    style={{
                      flex: 1,
                      padding: '12px 8px',
                      borderRadius: 12,
                      border: '2px solid',
                      borderColor: photoCategory === cat.id ? 'var(--accent)' : 'transparent',
                      background: photoCategory === cat.id ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-card)',
                      color: 'white',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: 20 }}>{cat.icon}</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'block' }}>Notes (optional):</label>
              <textarea
                value={photoNotes}
                onChange={(e) => setPhotoNotes(e.target.value)}
                placeholder="How are you feeling? Any changes you've noticed?"
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: 'white',
                  fontSize: 14,
                  resize: 'none',
                  minHeight: 60
                }}
              />
            </div>

            <input
              type="file"
              accept="image/*"
              capture="user"
              ref={photoInputRef}
              onChange={handlePhotoFileChange}
              style={{ display: 'none' }}
            />

            <button
              onClick={() => photoInputRef.current?.click()}
              style={{
                width: '100%',
                padding: 16,
                background: 'linear-gradient(135deg, var(--accent), var(--pink))',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 12
              }}
            >
              📸 Take Photo
            </button>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              Photos are stored locally on your device
            </p>
          </div>
        </div>
      )}

      {selectedPhoto && (
        <div className="analyze-modal" onClick={() => setSelectedPhoto(null)}>
          <div className="analyze-content" style={{ maxWidth: '90%', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selectedPhoto.week}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>{selectedPhoto.date}</p>
              </div>
              <button 
                onClick={() => setSelectedPhoto(null)}
                style={{ 
                  background: 'var(--bg-card)', 
                  border: 'none', 
                  color: 'white', 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  cursor: 'pointer',
                  fontSize: 18
                }}
              >
                ×
              </button>
            </div>
            
            <img 
              src={selectedPhoto.dataUrl} 
              alt={selectedPhoto.week}
              style={{ 
                width: '100%', 
                borderRadius: 12, 
                marginBottom: 16 
              }}
            />

            {selectedPhoto.notes && (
              <div style={{ 
                background: 'var(--bg-card)', 
                padding: 12, 
                borderRadius: 12,
                marginBottom: 16 
              }}>
                <p style={{ fontSize: 14, margin: 0 }}>{selectedPhoto.notes}</p>
              </div>
            )}

            <button
              onClick={() => deletePhoto(selectedPhoto.id)}
              style={{
                width: '100%',
                padding: 12,
                background: 'var(--error)',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🗑️ Delete Photo
            </button>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="analyze-modal" onClick={() => setShowAuthModal(false)}>
          <div className="analyze-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
              </h3>
              <button 
                onClick={() => setShowAuthModal(false)}
                style={{ 
                  background: 'var(--bg-card)', 
                  border: 'none', 
                  color: 'white', 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  cursor: 'pointer',
                  fontSize: 18
                }}
              >
                ×
              </button>
            </div>
            
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              {authMode === 'signup' 
                ? 'Create an account to sync your data across devices'
                : 'Sign in to access your workout data'}
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'block' }}>Email</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: 'white',
                  fontSize: 14
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'block' }}>Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="At least 6 characters"
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: 'white',
                  fontSize: 14
                }}
              />
            </div>

            {authError && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.2)', 
                padding: 12, 
                borderRadius: 8, 
                marginBottom: 16,
                fontSize: 13,
                color: '#ef4444'
              }}>
                {authError}
              </div>
            )}

            <button
              onClick={authMode === 'signup' ? handleSignUp : handleSignIn}
              style={{
                width: '100%',
                padding: 14,
                background: 'linear-gradient(135deg, var(--accent), var(--pink))',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 12
              }}
            >
              {authMode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
              <span 
                onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
              >
                {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
              </span>
            </p>
          </div>
        </div>
      )}
      </>
      )}

      {showAuthModal && (
        <div className="analyze-modal" onClick={() => setShowAuthModal(false)}>
          <div className="analyze-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
              </h3>
              <button 
                onClick={() => setShowAuthModal(false)}
                style={{ 
                  background: 'var(--bg-card)', 
                  border: 'none', 
                  color: 'white', 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  cursor: 'pointer',
                  fontSize: 18
                }}
              >
                ×
              </button>
            </div>
            
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              {authMode === 'signup' 
                ? 'Create an account to sync your data across devices'
                : 'Sign in to access your workout data'}
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'block' }}>Email</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: 'white',
                  fontSize: 14
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'block' }}>Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="At least 6 characters"
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: 'white',
                  fontSize: 14
                }}
              />
            </div>

            {authError && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.2)', 
                padding: 12, 
                borderRadius: 8, 
                marginBottom: 16,
                fontSize: 13,
                color: '#ef4444'
              }}>
                {authError}
              </div>
            )}

            <button
              onClick={authMode === 'signup' ? handleSignUp : handleSignIn}
              style={{
                width: '100%',
                padding: 14,
                background: 'linear-gradient(135deg, var(--accent), var(--pink))',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 12
              }}
            >
              {authMode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
              <span 
                onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
              >
                {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
