function ex(name, muscleGroup, equipment, difficulty, kind, met, pose, instructions, usesWeight = true) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    slug,
    name,
    muscleGroup,
    equipment,
    difficulty,
    kind,
    met,
    pose,
    instructions,
    usesWeight,
  };
}

const EXERCISES = [
  ex("Barbell Bench Press", "chest", ["barbell", "smith_machine"], "intermediate", "strength", 6, "press", [
    "Lie on a flat bench with eyes under the bar and feet planted.",
    "Grip slightly wider than shoulders and unrack with locked elbows.",
    "Lower the bar to mid-chest with elbows about 45–70° from the torso.",
    "Press the bar up until elbows are straight, then repeat.",
  ]),
  ex("Incline Bench Press", "chest", ["barbell", "smith_machine"], "intermediate", "strength", 6, "press", [
    "Set the bench to about 30–45° and lie back with feet down.",
    "Unrack over the upper chest.",
    "Lower with control to the upper chest.",
    "Press up without bouncing the bar.",
  ]),
  ex("Decline Bench Press", "chest", ["barbell"], "intermediate", "strength", 6, "press", [
    "Secure legs on a decline bench.",
    "Unrack over the lower chest.",
    "Lower the bar to the lower chest.",
    "Press back to lockout.",
  ]),
  ex("Dumbbell Bench Press", "chest", ["dumbbell"], "beginner", "strength", 5.5, "press", [
    "Sit, then lie back with dumbbells at chest height.",
    "Press the bells up over the chest.",
    "Lower until elbows are about in line with the bench.",
    "Press back up without clanging the bells hard.",
  ]),
  ex("Incline Dumbbell Press", "chest", ["dumbbell"], "beginner", "strength", 5.5, "press", [
    "Set an incline bench to 30–45°.",
    "Start with dumbbells beside the upper chest.",
    "Press up and slightly in.",
    "Lower with control.",
  ]),
  ex("Dumbbell Fly", "chest", ["dumbbell"], "beginner", "strength", 4.5, "fly", [
    "Lie on a bench with a slight elbow bend.",
    "Open the arms in a wide arc.",
    "Stop when you feel a stretch across the chest.",
    "Bring the bells back together over the chest.",
  ]),
  ex("Cable Fly", "chest", ["cable"], "beginner", "strength", 4.5, "fly", [
    "Set pulleys at chest height or slightly above.",
    "Step forward with a soft elbow bend.",
    "Bring the handles together in front of the chest.",
    "Return slowly to a stretch.",
  ]),
  ex("Pec Deck", "chest", ["machine"], "beginner", "strength", 4.5, "fly", [
    "Sit tall with forearms on the pads.",
    "Bring the pads together in front.",
    "Squeeze the chest briefly.",
    "Return without losing the elbow position.",
  ]),
  ex("Push Ups", "chest", ["bodyweight"], "beginner", "strength", 8, "pushup", [
    "Hands under shoulders, body in a straight line.",
    "Lower the chest toward the floor.",
    "Keep elbows from flaring too wide.",
    "Push the floor away until elbows are straight.",
  ], false),
  ex("Chest Press Machine", "chest", ["machine"], "beginner", "strength", 5, "press", [
    "Adjust the seat so handles are at mid-chest.",
    "Press until arms are almost straight.",
    "Do not slam the stack.",
    "Return with control.",
  ]),

  ex("Lat Pulldown", "back", ["machine", "cable"], "beginner", "strength", 5, "pulldown", [
    "Grip the bar slightly wider than shoulders.",
    "Lean back a little and brace the torso.",
    "Pull the bar to the upper chest.",
    "Let the arms lengthen without shrugging up.",
  ]),
  ex("Pull Ups", "back", ["bodyweight"], "advanced", "strength", 8, "pullup", [
    "Hang with a shoulder-width or slightly wider grip.",
    "Pull the chest toward the bar.",
    "Lower until arms are straight.",
    "Avoid kipping unless that is the intended style.",
  ], false),
  ex("Assisted Pull Ups", "back", ["machine", "band"], "beginner", "strength", 5.5, "pullup", [
    "Set assistance so you can do controlled reps.",
    "Keep the chest proud.",
    "Pull until the chin clears the bar or handles.",
    "Lower slowly.",
  ], false),
  ex("Seated Cable Row", "back", ["cable", "machine"], "beginner", "strength", 5, "row", [
    "Sit tall with a slight knee bend.",
    "Pull the handle to the lower ribs.",
    "Squeeze the shoulder blades together.",
    "Reach forward without rounding the low back.",
  ]),
  ex("Barbell Row", "back", ["barbell"], "intermediate", "strength", 6, "row", [
    "Hinge until the torso is about 30–45° from the floor.",
    "Pull the bar to the lower ribs.",
    "Keep the spine long.",
    "Lower without bouncing.",
  ]),
  ex("Dumbbell Row", "back", ["dumbbell"], "beginner", "strength", 5.5, "row", [
    "Brace one hand and knee on a bench.",
    "Let the dumbbell hang, then row to the hip.",
    "Keep the shoulder from rolling forward.",
    "Lower fully.",
  ]),
  ex("T-Bar Row", "back", ["barbell", "machine"], "intermediate", "strength", 6, "row", [
    "Stand over the bar with a hip hinge.",
    "Pull the plate stack or handle to the chest.",
    "Keep the neck in line with the spine.",
    "Lower under control.",
  ]),
  ex("Straight Arm Pulldown", "back", ["cable"], "beginner", "strength", 4, "pulldown", [
    "Hold a bar at shoulder height with straight arms.",
    "Sweep the bar to the thighs.",
    "Keep a small elbow bend.",
    "Raise back without shrugging.",
  ]),
  ex("Back Extension", "back", ["bodyweight", "machine"], "beginner", "strength", 4, "hinge", [
    "Pad at the hips on a hyperextension bench.",
    "Lower with a long spine.",
    "Raise until the body is in a straight line.",
    "Do not hyperextend aggressively.",
  ], false),

  ex("Overhead Press", "shoulders", ["barbell", "smith_machine"], "intermediate", "strength", 6, "ohp", [
    "Start with the bar at the front shoulders.",
    "Brace the glutes and ribs down.",
    "Press overhead until the head is through.",
    "Lower to the shoulders.",
  ]),
  ex("Dumbbell Shoulder Press", "shoulders", ["dumbbell"], "beginner", "strength", 5.5, "ohp", [
    "Sit or stand with bells at shoulder height.",
    "Press up without flaring the ribs.",
    "Lower to about ear height.",
    "Keep wrists stacked over elbows.",
  ]),
  ex("Arnold Press", "shoulders", ["dumbbell"], "intermediate", "strength", 5.5, "ohp", [
    "Start with palms facing you at the shoulders.",
    "Rotate as you press so palms face forward at the top.",
    "Reverse the path on the way down.",
    "Move smoothly, not fast.",
  ]),
  ex("Lateral Raise", "shoulders", ["dumbbell", "cable", "band"], "beginner", "strength", 4, "raise", [
    "Hold weights at the sides with a slight elbow bend.",
    "Raise to about shoulder height.",
    "Lead with the elbows, not the hands.",
    "Lower slowly.",
  ]),
  ex("Front Raise", "shoulders", ["dumbbell", "cable"], "beginner", "strength", 4, "raise", [
    "Raise the weight in front to shoulder height.",
    "Keep a soft elbow.",
    "Avoid swinging the torso.",
    "Lower under control.",
  ]),
  ex("Rear Delt Fly", "shoulders", ["dumbbell", "cable", "machine"], "beginner", "strength", 4, "fly", [
    "Hinge or sit with chest supported.",
    "Open the arms wide with elbows slightly bent.",
    "Squeeze the rear shoulders.",
    "Return without using momentum.",
  ]),
  ex("Face Pull", "shoulders", ["cable", "band"], "beginner", "strength", 4, "row", [
    "Set the rope at face height.",
    "Pull toward the face, elbows high.",
    "Rotate so the hands finish beside the ears.",
    "Control the return.",
  ]),
  ex("Shrugs", "shoulders", ["dumbbell", "barbell", "machine"], "beginner", "strength", 4, "shrug", [
    "Hold weights at the sides.",
    "Lift the shoulders toward the ears.",
    "Pause briefly.",
    "Lower fully. Do not roll the shoulders in a circle.",
  ]),

  ex("Barbell Curl", "arms", ["barbell"], "beginner", "strength", 4, "curl", [
    "Stand tall with the bar at the thighs.",
    "Curl without swinging the torso.",
    "Squeeze at the top.",
    "Lower until the arms are long.",
  ]),
  ex("Dumbbell Curl", "arms", ["dumbbell"], "beginner", "strength", 4, "curl", [
    "Curl one or both dumbbells.",
    "Keep elbows close to the sides.",
    "Turn the palms up as you lift if using a supinating curl.",
    "Lower slowly.",
  ]),
  ex("Hammer Curl", "arms", ["dumbbell"], "beginner", "strength", 4, "curl", [
    "Hold dumbbells with a neutral grip.",
    "Curl toward the shoulders.",
    "Keep wrists straight.",
    "Lower without swinging.",
  ]),
  ex("Preacher Curl", "arms", ["barbell", "dumbbell", "machine"], "beginner", "strength", 3.5, "curl", [
    "Rest the upper arms on the pad.",
    "Curl without lifting the elbows off.",
    "Stop short of a painful lockout at the bottom.",
    "Control both directions.",
  ]),
  ex("Cable Curl", "arms", ["cable"], "beginner", "strength", 4, "curl", [
    "Stand facing the low pulley.",
    "Curl the bar or handle to the shoulders.",
    "Keep elbows pinned.",
    "Resist the stack on the way down.",
  ]),
  ex("Triceps Pushdown", "arms", ["cable"], "beginner", "strength", 4, "pushdown", [
    "Elbows stay by the sides.",
    "Push the handle down until the arms are straight.",
    "Do not lean excessively.",
    "Let the bar rise to about 90° at the elbow.",
  ]),
  ex("Overhead Triceps Extension", "arms", ["dumbbell", "cable"], "beginner", "strength", 4, "extension", [
    "Hold the weight overhead.",
    "Bend the elbows to lower behind the head.",
    "Keep upper arms still.",
    "Extend back to the start.",
  ]),
  ex("Skull Crushers", "arms", ["barbell", "dumbbell"], "intermediate", "strength", 4, "extension", [
    "Lie on a bench with arms vertical.",
    "Bend elbows to lower the bar toward the forehead or behind the head.",
    "Extend the elbows without flaring wildly.",
    "Use a weight you can control.",
  ]),
  ex("Dumbbell Triceps Extension", "arms", ["dumbbell"], "beginner", "strength", 4, "extension", [
    "Support the upper arm.",
    "Lower the dumbbell by bending only the elbow.",
    "Extend fully.",
    "Repeat for all planned reps.",
  ]),

  ex("Barbell Squat", "legs", ["barbell", "smith_machine"], "intermediate", "strength", 6.5, "squat", [
    "Bar on the upper back, feet about shoulder width.",
    "Brace, then sit down and slightly back.",
    "Keep the chest up and knees tracking over the feet.",
    "Stand by pushing the floor away.",
  ]),
  ex("Goblet Squat", "legs", ["dumbbell", "kettlebell"], "beginner", "strength", 5.5, "squat", [
    "Hold a bell at the chest.",
    "Squat between the knees.",
    "Keep the elbows inside the knees if mobility allows.",
    "Stand tall at the top.",
  ]),
  ex("Leg Press", "legs", ["machine"], "beginner", "strength", 5, "press", [
    "Feet mid-platform, not too high or low.",
    "Unlock the safeties.",
    "Lower until the thighs are at least parallel.",
    "Press without locking the knees harshly.",
  ]),
  ex("Leg Extension", "legs", ["machine"], "beginner", "strength", 4, "extension", [
    "Pad on the lower shins.",
    "Extend the knees fully.",
    "Lower without bouncing.",
    "Avoid using momentum.",
  ]),
  ex("Leg Curl", "legs", ["machine"], "beginner", "strength", 4, "curl", [
    "Pad just above the heels.",
    "Curl the heels toward the glutes.",
    "Hips stay down.",
    "Lower slowly.",
  ]),
  ex("Romanian Deadlift", "legs", ["barbell", "dumbbell"], "intermediate", "strength", 6, "hinge", [
    "Soft knees, bar close to the legs.",
    "Hinge until you feel a hamstring stretch.",
    "Keep the back long.",
    "Stand by squeezing the glutes.",
  ]),
  ex("Lunges", "legs", ["bodyweight", "dumbbell", "barbell"], "beginner", "strength", 6, "lunge", [
    "Step forward or reverse.",
    "Both knees bend to about 90°.",
    "Front heel stays down.",
    "Push back to stand.",
  ]),
  ex("Bulgarian Split Squat", "legs", ["bodyweight", "dumbbell"], "intermediate", "strength", 6.5, "lunge", [
    "Rear foot on a bench.",
    "Drop the back knee toward the floor.",
    "Front shin stays fairly vertical.",
    "Push through the front foot.",
  ]),
  ex("Calf Raise", "legs", ["machine", "dumbbell", "bodyweight"], "beginner", "strength", 4, "calf", [
    "Balls of the feet on a step or platform.",
    "Lower the heels for a stretch.",
    "Rise onto the toes.",
    "Pause at the top.",
  ]),
  ex("Hip Thrust", "legs", ["barbell", "machine"], "beginner", "strength", 5, "thrust", [
    "Upper back on a bench, bar over the hips.",
    "Drive the hips up until the torso is flat.",
    "Squeeze the glutes.",
    "Lower without losing the brace.",
  ]),

  ex("Walking", "cardio", ["bodyweight"], "beginner", "cardio", 3.5, "cardio", [
    "Walk at a pace you can sustain.",
    "Keep an easy arm swing.",
    "Use incline if you want more effort without extra speed.",
    "Log duration and distance.",
  ], false),
  ex("Running", "cardio", ["bodyweight"], "intermediate", "cardio", 9.8, "cardio", [
    "Warm up with an easy walk.",
    "Settle into a rhythm you can hold.",
    "Keep steps light.",
    "Cool down before stopping fully.",
  ], false),
  ex("Treadmill", "cardio", ["machine"], "beginner", "cardio", 8, "cardio", [
    "Start with a walk, then set speed.",
    "Use the rails only for balance, not support.",
    "Add incline if needed.",
    "Log speed, incline, duration.",
  ], false),
  ex("Cycling", "cardio", ["machine"], "beginner", "cardio", 6.8, "cardio", [
    "Set the saddle so the knee stays soft at the bottom.",
    "Pedal smoothly.",
    "Choose resistance you can hold.",
    "Log duration and distance.",
  ], false),
  ex("Elliptical", "cardio", ["machine"], "beginner", "cardio", 5.5, "cardio", [
    "Stand tall and light on the pedals.",
    "Use the handles if you want more upper-body work.",
    "Keep a steady cadence.",
    "Log duration and resistance.",
  ], false),
  ex("Stair Climber", "cardio", ["machine"], "intermediate", "cardio", 9, "cardio", [
    "Stand upright, not hunched over the rails.",
    "Take full steps.",
    "Use rails only for balance.",
    "Log duration.",
  ], false),
  ex("Rowing", "cardio", ["machine"], "intermediate", "cardio", 7, "cardio", [
    "Order: legs, then hips, then arms.",
    "Return: arms, then hips, then legs.",
    "Keep the chain level.",
    "Log duration and distance.",
  ], false),
];

module.exports = { EXERCISES };
