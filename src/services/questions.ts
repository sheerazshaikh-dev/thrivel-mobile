import type {Question} from './types';
export const QUESTIONS:Question[]=[
{id:'first_name',section:'About you',prompt:'What should I call you?',type:'text'},
{id:'sex',section:'About you',prompt:'Are you male or female?',type:'single',options:['Male','Female']},
{id:'age',section:'About you',prompt:'What is your age?',type:'number',min:18,max:100,unit:'years'},
{id:'weight',section:'About you',prompt:'What is your current weight?',explanation:'Enter your weight in pounds.',type:'number',min:70,max:700,unit:'lb'},
{id:'primary_goal',section:'Goals',prompt:"What's your primary health goal?",explanation:'Pick the outcome that matters most right now.',type:'single',options:['Weight management','Recovery & healing','Longevity','Performance','Energy']},
{id:'secondary_goals',section:'Goals',prompt:'Any secondary goals?',type:'multi',options:['Better sleep','Muscle recovery','Focus','Immune support','Skin quality']},
{id:'body_profile',section:'Body profile',prompt:'Would you like to add body photos for a more personalized body-composition profile?',explanation:'Optional. Upload front and side photos. The photos are analyzed once as a secondary wellness signal, kept private, and reviewed by a human. They are never used to diagnose a condition or estimate an exact body-fat percentage.',type:'image',optional:true},
{id:'comfortable_injectables',section:'Preferences',prompt:'Are you comfortable taking injectables?',type:'yesno'},
{id:'activity_level',section:'Lifestyle',prompt:'How active are you day-to-day?',type:'slider',min:1,max:10},
{id:'training_freq',section:'Lifestyle',prompt:'How many times do you work out each week?',type:'single',options:['0','1-2','3-4','5-6','7+']},
{id:'diet',section:'Lifestyle',prompt:'Which best describes your diet?',type:'single',options:['None','Omnivore','Vegetarian','Vegan','Pescatarian','Keto','Other']},
{id:'sleep_quality',section:'Lifestyle',prompt:'How would you rate your sleep quality?',type:'slider',min:1,max:10},
{id:'current_medications',section:'Health context',prompt:'List any current medications and dosages.',explanation:'This helps the reviewer check for conflicts. Do not stop or change any medication here.',type:'text',optional:true},
{id:'supplements',section:'Health context',prompt:'Are you currently taking any vitamins or supplements?',type:'text',optional:true}
];
