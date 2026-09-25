/** Major cities / districts per state, used for the city dropdown. */
export const STATE_CITIES: Record<string, string[]> = {
  "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Hosur", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Ooty", "Perambalur", "Pollachi", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kochi", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru", "Bidar", "Chikkamagaluru", "Chitradurga", "Davanagere", "Dharwad", "Hassan", "Hubballi", "Kalaburagi", "Mandya", "Mangaluru", "Mysuru", "Raichur", "Shivamogga", "Tumakuru", "Udupi", "Vijayapura"],
  "Andhra Pradesh": ["Anantapur", "Chittoor", "Eluru", "Guntur", "Kadapa", "Kakinada", "Kurnool", "Nellore", "Ongole", "Rajahmundry", "Srikakulam", "Tirupati", "Vijayawada", "Visakhapatnam", "Vizianagaram"],
  "Telangana": ["Adilabad", "Hyderabad", "Karimnagar", "Khammam", "Mahbubnagar", "Nalgonda", "Nizamabad", "Secunderabad", "Siddipet", "Warangal"],
  "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Jalgaon", "Kolhapur", "Latur", "Mumbai", "Nagpur", "Nanded", "Nashik", "Navi Mumbai", "Pune", "Sangli", "Satara", "Solapur", "Thane"],
  "Gujarat": ["Ahmedabad", "Anand", "Bhavnagar", "Bhuj", "Gandhinagar", "Jamnagar", "Junagadh", "Mehsana", "Rajkot", "Surat", "Vadodara", "Vapi"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Dwarka", "Rohini"],
  "New Delhi": ["New Delhi"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Bareilly", "Ghaziabad", "Gorakhpur", "Kanpur", "Lucknow", "Meerut", "Moradabad", "Noida", "Prayagraj", "Varanasi"],
  "Rajasthan": ["Ajmer", "Alwar", "Bhilwara", "Bikaner", "Jaipur", "Jodhpur", "Kota", "Sikar", "Udaipur"],
  "Madhya Pradesh": ["Bhopal", "Gwalior", "Indore", "Jabalpur", "Rewa", "Sagar", "Satna", "Ujjain"],
  "West Bengal": ["Asansol", "Durgapur", "Howrah", "Kolkata", "Siliguri"],
  "Punjab": ["Amritsar", "Bathinda", "Jalandhar", "Ludhiana", "Mohali", "Patiala"],
  "Haryana": ["Ambala", "Faridabad", "Gurugram", "Hisar", "Karnal", "Panipat", "Rohtak", "Sonipat"],
  "Bihar": ["Bhagalpur", "Gaya", "Muzaffarpur", "Patna", "Purnia"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Puri", "Rourkela", "Sambalpur"],
  "Jharkhand": ["Bokaro", "Dhanbad", "Jamshedpur", "Ranchi"],
  "Chhattisgarh": ["Bhilai", "Bilaspur", "Durg", "Korba", "Raipur"],
  "Assam": ["Dibrugarh", "Guwahati", "Jorhat", "Silchar", "Tezpur"],
  "Uttarakhand": ["Dehradun", "Haldwani", "Haridwar", "Nainital", "Rishikesh", "Roorkee"],
  "Himachal Pradesh": ["Dharamshala", "Kullu", "Manali", "Mandi", "Shimla", "Solan"],
  "Goa": ["Margao", "Mapusa", "Panaji", "Vasco da Gama"],
  "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"],
  "Chandigarh": ["Chandigarh"],
  "Jammu and Kashmir": ["Anantnag", "Baramulla", "Jammu", "Srinagar"],
  "Ladakh": ["Kargil", "Leh"],
};

export const citiesForState = (state?: string | null): string[] =>
  (state && STATE_CITIES[state]) || [];
