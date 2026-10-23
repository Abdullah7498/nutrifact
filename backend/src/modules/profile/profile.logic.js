import { z } from 'zod';

const today = () => new Date();
export const profileSchema = z.object({
  dateOfBirth: z.iso.date(),
  sexForEstimate: z.enum(['female', 'male', 'unspecified']),
  units: z.enum(['metric', 'imperial']),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(350),
  goal: z.enum(['lose', 'maintain', 'gain', 'muscle', 'recomp']),
  targetWeightKg: z.number().min(30).max(350).nullable(),
  activity: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  dietaryPreferences: z.object({
    vegetarian: z.boolean(),
    vegan: z.boolean(),
    halal: z.boolean(),
    allergies: z.string().max(500),
    foodsToAvoid: z.string().max(500),
    other: z.string().max(500),
  }),
});
export const planSchema = z.object({
  calories: z.number().int().min(1200).max(6000),
  protein: z.number().int().min(20).max(400),
  carbs: z.number().int().min(20).max(800),
  fats: z.number().int().min(20).max(250),
});
export const saveSchema = profileSchema.extend({ plan: planSchema });

export function validateProfile(input) {
  const profile = profileSchema.parse(input);
  const born = new Date(`${profile.dateOfBirth}T00:00:00Z`);
  if (
    Number.isNaN(born.getTime()) ||
    born.toISOString().slice(0, 10) !== profile.dateOfBirth
  ) {
    throw new Error('Enter a valid date of birth');
  }
  const age = (today().getTime() - born.getTime()) / 31556952000;
  if (age < 18 || age > 120)
    throw new Error('This estimate is available for adults aged 18 or older');
  if (
    profile.goal === 'lose' &&
    profile.targetWeightKg != null &&
    profile.targetWeightKg >= profile.weightKg
  )
    throw new Error('Target weight must be below current weight');
  if (
    profile.goal === 'gain' &&
    profile.targetWeightKg != null &&
    profile.targetWeightKg <= profile.weightKg
  )
    throw new Error('Target weight must be above current weight');
  return { profile, age };
}

export function calorieAdjustment(profile) {
  const target = profile.targetWeightKg;
  if (profile.goal === 'lose') return -300;
  if (profile.goal === 'gain') return 300;
  if (profile.goal === 'maintain') return 0;
  if (target != null && target < profile.weightKg) return -300;
  if (target != null && target === profile.weightKg) return 0;
  if (profile.goal === 'recomp')
    return target != null && target > profile.weightKg ? 150 : -200;
  return 150;
}

export function estimatePlan(input) {
  const { profile, age } = validateProfile(input);
  const offset =
    profile.sexForEstimate === 'male'
      ? 5
      : profile.sexForEstimate === 'female'
        ? -161
        : -78;
  const resting =
    10 * profile.weightKg + 6.25 * profile.heightCm - 5 * age + offset;
  const factor = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  }[profile.activity];
  const adjustment = calorieAdjustment(profile);
  const calories = Math.max(
    1200,
    Math.min(6000, Math.round((resting * factor + adjustment) / 10) * 10),
  );
  const proteinFactor = {
    lose: 1.8,
    maintain: 1.4,
    gain: 1.6,
    muscle:
      profile.targetWeightKg != null &&
      profile.targetWeightKg < profile.weightKg
        ? 2.0
        : 1.8,
    recomp: 2.0,
  }[profile.goal];
  const protein = Math.round(profile.weightKg * proteinFactor);
  const fats = Math.round((calories * 0.28) / 9);
  const carbs = Math.round((calories - protein * 4 - fats * 9) / 4);
  return { calories, protein, carbs, fats };
}

export function buildDietGuidance(input) {
  const { profile } = validateProfile(input);
  const prefs = profile.dietaryPreferences;
  const guidance = [];
  const goalAdvice = {
    lose: 'Use the calorie target as a moderate deficit. Include a protein source and vegetables at meals to support fullness.',
    maintain:
      'Keep meals balanced across the day and adjust portions if your weight trend changes.',
    gain: 'Use the calorie target as a modest surplus. Add energy-dense snacks or larger portions if needed.',
    muscle:
      'Spread protein across meals and pair the plan with resistance training.',
    recomp: 'Keep protein high and pair the plan with resistance training.',
  };
  guidance.push(goalAdvice[profile.goal]);
  if (
    ['muscle', 'recomp'].includes(profile.goal) &&
    profile.targetWeightKg != null &&
    profile.targetWeightKg < profile.weightKg
  ) {
    guidance.push(
      'Your target weight is below your current weight, so this plan uses a moderate calorie deficit and a higher protein target to support muscle retention while losing weight.',
    );
  } else if (
    ['muscle', 'recomp'].includes(profile.goal) &&
    profile.targetWeightKg != null &&
    profile.targetWeightKg > profile.weightKg
  ) {
    guidance.push(
      'Your target weight is above your current weight, so this plan uses a modest calorie surplus.',
    );
  }
  if (profile.activity === 'active' || profile.activity === 'very_active') {
    guidance.push(
      'Plan carbohydrate-rich meals around longer or harder activity and keep fluids available.',
    );
  } else {
    guidance.push(
      'Use your usual activity pattern to judge portions, and revisit the estimate if your routine changes.',
    );
  }
  if (prefs.vegan)
    guidance.push(
      'Choose varied plant proteins; pay attention to vitamin B12 and other nutrients that may need fortified foods or supplements.',
    );
  else if (prefs.vegetarian)
    guidance.push('Choose varied vegetarian protein sources across meals.');
  if (prefs.halal)
    guidance.push(
      'Choose halal-compliant ingredients and check product certification where relevant.',
    );
  if (prefs.allergies || prefs.foodsToAvoid || prefs.other) {
    guidance.push(
      'Your food restrictions are saved with this plan. Specific meal suggestions are withheld because free-text restrictions cannot be checked reliably. Verify every ingredient and cross-contact risk before eating.',
    );
  } else if (prefs.vegan) {
    guidance.push(
      'Meal ideas: lentils with rice and vegetables; tofu with grains and greens; bean and vegetable wraps.',
    );
  } else if (prefs.vegetarian) {
    guidance.push(
      'Meal ideas: lentil and vegetable bowls; eggs with whole grains and greens; yogurt with fruit and seeds.',
    );
  } else {
    guidance.push(
      'Meal ideas: lean protein with whole grains and vegetables; beans with rice and salad; fruit and yogurt for a snack.',
    );
  }
  if (prefs.other)
    guidance.push(
      'Review your other saved preferences when choosing meals: ' + prefs.other,
    );
  return guidance;
}
