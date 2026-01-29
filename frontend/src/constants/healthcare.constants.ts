import { z } from 'zod';

// 1. Define the Zod Schemas first (Source of Truth)
export const CitySchema = z.enum([
    'Mumbai',
    'Delhi',
    'Bangalore',
    'Hyderabad',
    'Ahmedabad',
    'Chennai',
    'Kolkata',
    'Surat',
    'Pune',
    'Jaipur',
    'Lucknow',
    'Kanpur',
    'Nagpur',
    'Indore',
    'Thane'
]);

export const SpecialtySchema = z.enum([
    'General Physician',
    'Cardiologist',
    'Dermatologist',
    'Pediatrician',
    'Gynecologist',
    'Orthopedic Surgeon',
    'Neurologist',
    'Psychiatrist',
    'Ophthalmologist',
    'ENT Specialist',
    'Dentist',
    'Urologist',
    'Gastroenterologist',
    'Endocrinologist',
    'Oncologist'
]);

export const BloodTypeSchema = z.enum([
    'A_POS',
    'A_NEG',
    'B_POS',
    'B_NEG',
    'AB_POS',
    'AB_NEG',
    'O_POS',
    'O_NEG'
]);

// 2. Derive the constants from the schemas (for UI dropdowns)
export const CITIES = CitySchema.options;
export const SPECIALTIES = SpecialtySchema.options;
export const BLOOD_TYPES = BloodTypeSchema.options;

// 3. Derive the TypeScript types from the schemas
export type City = z.infer<typeof CitySchema>;
export type Specialty = z.infer<typeof SpecialtySchema>;
export type BloodType = z.infer<typeof BloodTypeSchema>;
