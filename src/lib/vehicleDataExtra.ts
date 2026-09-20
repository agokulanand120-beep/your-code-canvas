// Supplementary brands / models / variants that extend the base catalogue in
// vehicleData.ts. Kept in a separate file so the base list stays readable.
import type { VehicleBrand } from "./vehicleData";

const v = (...names: string[]) => names.map((name) => ({ name }));

export const extraCarBrands: VehicleBrand[] = [
  {
    name: "Maruti Suzuki",
    models: [
      { name: "Swift Dzire Tour", variants: v("S", "Tour S CNG") },
      { name: "Zen Estilo", variants: v("LXi", "VXi") },
      { name: "Omni", variants: v("E", "E MPI STD", "Cargo") },
      { name: "SX4", variants: v("VXi", "ZXi", "VDi") },
      { name: "Kizashi", variants: v("AT", "MT") },
      { name: "Wagon R Stingray", variants: v("LXi", "VXi") },
      { name: "Celerio X", variants: v("VXi", "ZXi", "ZXi+") },
      { name: "Baleno RS", variants: v("1.0 Turbo") },
      { name: "e Vitara", variants: v("49 kWh", "61 kWh") },
    ],
  },
  {
    name: "Hyundai",
    models: [
      { name: "Santro", variants: v("Era", "Magna", "Sportz", "Asta") },
      { name: "Santro Xing", variants: v("GL", "GLS", "XO", "XS") },
      { name: "Eon", variants: v("D-Lite", "Era", "Magna", "Sportz") },
      { name: "Accent", variants: v("GLE", "GLS", "Executive", "CRDi") },
      { name: "Getz", variants: v("GLE", "GLS", "GVS", "CRDi") },
      { name: "Elantra", variants: v("S", "SX", "SX(O)") },
      { name: "Elite i20", variants: v("Era", "Magna", "Sportz", "Asta", "Asta(O)") },
      { name: "i20 Active", variants: v("S", "SX", "SX(O)") },
      { name: "Creta N Line", variants: v("N8", "N10", "N10 DCT") },
      { name: "Creta Electric", variants: v("Executive", "Smart", "Premium", "Excellence") },
      { name: "Sonata", variants: v("GLS", "Embera") },
      { name: "Santa Fe", variants: v("2WD AT", "4WD AT") },
    ],
  },
  {
    name: "Tata",
    models: [
      { name: "Indica", variants: v("eV2", "V2 DLS", "V2 DLG", "Vista") },
      { name: "Indigo", variants: v("eCS LS", "eCS LX", "CS GLS", "Manza") },
      { name: "Bolt", variants: v("XE", "XM", "XT") },
      { name: "Zest", variants: v("XE", "XM", "XMA", "XT") },
      { name: "Hexa", variants: v("XE", "XM", "XT", "XTA") },
      { name: "Sumo", variants: v("Gold", "Grande", "Victa") },
      { name: "Aria", variants: v("Pleasure", "Pride", "Pure") },
      { name: "Nano", variants: v("Std", "CX", "LX", "GenX") },
      { name: "Tiago NRG", variants: v("XT", "XZ") },
      { name: "Altroz Racer", variants: v("R1", "R2", "R3") },
      { name: "Curvv EV", variants: v("Creative", "Accomplished", "Empowered") },
      { name: "Harrier EV", variants: v("Adventure", "Fearless", "Empowered") },
    ],
  },
  {
    name: "Mahindra",
    models: [
      { name: "Bolero Neo", variants: v("N4", "N8", "N10", "N10(O)") },
      { name: "Bolero Neo Plus", variants: v("P4", "P10") },
      { name: "KUV100 NXT", variants: v("K2", "K4+", "K6+", "K8") },
      { name: "Marazzo", variants: v("M2", "M4+", "M6+") },
      { name: "TUV300", variants: v("T4", "T6", "T8", "T10") },
      { name: "Quanto", variants: v("C2", "C4", "C6", "C8") },
      { name: "Xylo", variants: v("D2", "D4", "E4", "E8", "H4", "H8") },
      { name: "Scorpio Classic", variants: v("S", "S11") },
      { name: "Thar Roxx", variants: v("MX1", "MX3", "MX5", "AX3L", "AX7L") },
      { name: "XUV700 Facelift", variants: v("MX", "AX3", "AX5", "AX7", "AX7L") },
    ],
  },
  {
    name: "Kia",
    models: [
      { name: "Syros", variants: v("HTK", "HTK+", "HTX", "HTX+") },
      { name: "Seltos X Line", variants: v("X Line DCT", "X Line AT") },
      { name: "Sonet X Line", variants: v("X Line DCT", "X Line iMT") },
      { name: "Carens Clavis", variants: v("HTK+", "HTX", "HTX+") },
    ],
  },
  {
    name: "Toyota",
    models: [
      { name: "Corolla Altis", variants: v("G", "GL", "VL", "D-4D") },
      { name: "Qualis", variants: v("FS B3", "GS", "GST") },
      { name: "Yaris", variants: v("J", "G", "V", "VX") },
      { name: "Innova", variants: v("2.5 G", "2.5 GX", "2.5 VX", "2.5 ZX") },
      { name: "Fortuner Legender", variants: v("4x2 AT", "4x4 AT") },
      { name: "Urban Cruiser Hyryder", variants: v("E", "S", "G", "V") },
      { name: "Urban Cruiser EV", variants: v("49 kWh", "61 kWh") },
    ],
  },
  {
    name: "Honda",
    models: [
      { name: "Civic", variants: v("V", "VX", "ZX", "Hybrid") },
      { name: "Accord", variants: v("2.4 AT", "VTi-L", "Hybrid") },
      { name: "CR-V", variants: v("2.0 2WD", "2.4 AWD", "1.6 Diesel") },
      { name: "BR-V", variants: v("S", "V", "VX") },
      { name: "Brio", variants: v("E", "S", "V", "VX") },
      { name: "Mobilio", variants: v("E", "S", "V", "RS") },
      { name: "Amaze 3rd Gen", variants: v("V", "VX", "ZX") },
    ],
  },
  {
    name: "Volkswagen",
    models: [
      { name: "Ameo", variants: v("Trendline", "Comfortline", "Highline") },
      { name: "Jetta", variants: v("Trendline", "Comfortline", "Highline") },
      { name: "Passat", variants: v("Comfortline", "Highline") },
      { name: "Beetle", variants: v("1.4 TSI") },
      { name: "T-Roc", variants: v("1.5 TSI") },
      { name: "Golf GTI", variants: v("2.0 TSI") },
      { name: "Tiguan R-Line", variants: v("2.0 TSI 4Motion") },
    ],
  },
  {
    name: "Skoda",
    models: [
      { name: "Octavia", variants: v("Ambition", "Style", "L&K", "RS") },
      { name: "Fabia", variants: v("Classic", "Ambiente", "Elegance") },
      { name: "Laura", variants: v("Ambiente", "Ambition", "Elegance") },
      { name: "Yeti", variants: v("Ambition", "Elegance") },
      { name: "Karoq", variants: v("Style") },
      { name: "Slavia Monte Carlo", variants: v("1.0 TSI", "1.5 TSI DSG") },
      { name: "Kushaq Monte Carlo", variants: v("1.0 TSI", "1.5 TSI DSG") },
    ],
  },
  {
    name: "Renault",
    models: [
      { name: "Duster", variants: v("RxE", "RxL", "RxS", "RxZ") },
      { name: "Captur", variants: v("RxE", "RxL", "RxT", "Platine") },
      { name: "Lodgy", variants: v("RxE", "RxL", "RxZ", "Stepway") },
      { name: "Fluence", variants: v("E2", "E4") },
      { name: "Scala", variants: v("RxE", "RxL", "RxZ") },
      { name: "Pulse", variants: v("RxE", "RxL", "RxZ") },
      { name: "Kwid Climber", variants: v("1.0 MT", "1.0 AMT") },
    ],
  },
  {
    name: "Nissan",
    models: [
      { name: "Micra", variants: v("XE", "XL", "XV", "XV CVT") },
      { name: "Sunny", variants: v("XE", "XL", "XV", "XV CVT") },
      { name: "Terrano", variants: v("XE", "XL", "XV", "XV Premium") },
      { name: "Evalia", variants: v("XE", "XL", "XV") },
      { name: "Magnite Geza", variants: v("Turbo CVT", "Turbo MT") },
    ],
  },
  {
    name: "Ford",
    models: [
      { name: "Figo", variants: v("Ambiente", "Trend", "Titanium", "Titanium+") },
      { name: "Figo Aspire", variants: v("Ambiente", "Trend", "Titanium", "Titanium+") },
      { name: "Freestyle", variants: v("Ambiente", "Trend", "Titanium", "Titanium+") },
      { name: "EcoSport", variants: v("Ambiente", "Trend", "Titanium", "Titanium+", "S", "Thunder") },
      { name: "Endeavour", variants: v("Titanium 4x2", "Titanium+ 4x4", "Sport") },
      { name: "Fiesta", variants: v("Ambiente", "Trend", "Titanium") },
      { name: "Ikon", variants: v("1.3 Flair", "1.6 ZXi") },
      { name: "Mustang", variants: v("GT Fastback") },
    ],
  },
  {
    name: "Chevrolet",
    models: [
      { name: "Beat", variants: v("PS", "LS", "LT", "LTZ") },
      { name: "Spark", variants: v("PS", "LS", "LT") },
      { name: "Cruze", variants: v("LT", "LTZ") },
      { name: "Sail", variants: v("Base", "LS", "LT") },
      { name: "Sail U-VA", variants: v("Base", "LS", "LT") },
      { name: "Enjoy", variants: v("LS", "LT", "LTZ") },
      { name: "Tavera", variants: v("Neo 3", "LS", "LT") },
      { name: "Captiva", variants: v("LT", "LTZ") },
      { name: "Optra", variants: v("LS", "LT", "Magnum") },
    ],
  },
  {
    name: "Fiat",
    models: [
      { name: "Punto", variants: v("Active", "Dynamic", "Emotion", "Evo", "Abarth") },
      { name: "Linea", variants: v("Active", "Dynamic", "Emotion", "T-Jet") },
      { name: "Palio", variants: v("Stile", "1.2 EL", "1.6 Sport") },
      { name: "Avventura", variants: v("Active", "Dynamic", "Emotion") },
      { name: "Urban Cross", variants: v("Active", "Dynamic", "Emotion") },
    ],
  },
  {
    name: "MG",
    models: [
      { name: "Hector Blackstorm", variants: v("1.5 Turbo CVT", "2.0 Diesel") },
      { name: "ZS EV Facelift", variants: v("Executive", "Excite", "Exclusive") },
      { name: "M9 EV", variants: v("Presidential") },
      { name: "Cyberster", variants: v("AWD") },
    ],
  },
  {
    name: "Jeep",
    models: [
      { name: "Compass Trailhawk", variants: v("2.0 Diesel 4x4 AT") },
      { name: "Meridian X", variants: v("4x2 AT", "4x4 AT") },
    ],
  },
  {
    name: "Citroen",
    models: [
      { name: "C5 Aircross", variants: v("Feel", "Shine") },
      { name: "Basalt X", variants: v("You", "Plus", "Max") },
    ],
  },
  {
    name: "BMW",
    models: [
      { name: "1 Series", variants: v("118i", "118d") },
      { name: "6 Series GT", variants: v("620d", "630i") },
      { name: "8 Series", variants: v("840i Gran Coupe") },
      { name: "X4", variants: v("xDrive30i", "xDrive30d M Sport") },
      { name: "X6", variants: v("xDrive40i", "M Sport") },
      { name: "Z4", variants: v("sDrive20i M Sport") },
      { name: "M340i", variants: v("xDrive") },
      { name: "iX1", variants: v("xDrive30 M Sport", "LWB") },
    ],
  },
  {
    name: "Mercedes-Benz",
    models: [
      { name: "CLA", variants: v("200", "220d", "AMG 35") },
      { name: "CLS", variants: v("300d", "450") },
      { name: "GLC Coupe", variants: v("300 4MATIC", "43 AMG") },
      { name: "G-Class", variants: v("G 350d", "G 400d", "AMG G 63") },
      { name: "V-Class", variants: v("Expression", "Elite", "Marco Polo") },
      { name: "Maybach S-Class", variants: v("S 580", "S 680") },
      { name: "AMG GT", variants: v("63 S", "43 4MATIC+") },
    ],
  },
  {
    name: "Audi",
    models: [
      { name: "A3", variants: v("35 TFSI", "35 TDI") },
      { name: "A5", variants: v("Sportback 40 TFSI", "Cabriolet") },
      { name: "A7", variants: v("55 TFSI") },
      { name: "Q2", variants: v("Premium", "Premium Plus", "Technology") },
      { name: "Q3 Sportback", variants: v("40 TFSI Technology") },
      { name: "RS Q8", variants: v("4.0 TFSI") },
      { name: "S5", variants: v("Sportback") },
      { name: "TT", variants: v("45 TFSI") },
    ],
  },
  {
    name: "Volvo",
    models: [
      { name: "V40", variants: v("Kinetic", "Inscription", "Cross Country") },
      { name: "S80", variants: v("D4", "D5") },
      { name: "EX40", variants: v("Ultimate") },
      { name: "EC40", variants: v("Ultimate") },
      { name: "EX90", variants: v("Twin Motor Ultra") },
    ],
  },
  {
    name: "Lexus",
    models: [
      { name: "UX", variants: v("300e Exquisite", "300e Luxury") },
      { name: "LM", variants: v("350h 4-Seater", "350h 7-Seater") },
      { name: "RZ", variants: v("450e") },
    ],
  },
  {
    name: "Land Rover",
    models: [
      { name: "Freelander 2", variants: v("SE", "HSE") },
      { name: "Range Rover Sport SVR", variants: v("5.0 V8") },
      { name: "Defender 130", variants: v("SE", "X") },
    ],
  },
  {
    name: "Jaguar",
    models: [
      { name: "XE", variants: v("Pure", "Prestige", "Portfolio", "R-Dynamic S") },
      { name: "XF", variants: v("Pure", "Prestige", "Portfolio", "R-Dynamic") },
      { name: "XJ", variants: v("Portfolio", "Autobiography") },
      { name: "F-Pace", variants: v("Prestige", "Portfolio", "R-Dynamic S") },
      { name: "E-Pace", variants: v("S", "SE", "R-Dynamic") },
      { name: "I-Pace", variants: v("S", "SE", "HSE") },
      { name: "F-Type", variants: v("Coupe", "Convertible", "R") },
    ],
  },
  {
    name: "Porsche",
    models: [
      { name: "718", variants: v("Cayman", "Boxster", "GTS 4.0") },
      { name: "Cayenne Coupe", variants: v("Base", "S", "Turbo GT") },
      { name: "Macan EV", variants: v("Base", "4", "Turbo") },
    ],
  },
  {
    name: "BYD",
    models: [
      { name: "Sealion 7", variants: v("Premium", "Performance") },
      { name: "eMAX 7", variants: v("Premium 6-Seater", "Superior 7-Seater") },
    ],
  },
  {
    name: "Mini",
    models: [
      { name: "Cooper", variants: v("S 3-Door", "SE Electric", "Convertible") },
      { name: "Countryman", variants: v("Cooper S", "JCW", "Electric") },
      { name: "Clubman", variants: v("Cooper S", "JCW") },
    ],
  },
  {
    name: "Datsun",
    models: [
      { name: "GO", variants: v("D", "A", "T", "T(O)") },
      { name: "GO+", variants: v("D", "A", "T", "T(O)") },
      { name: "redi-GO", variants: v("D", "A", "T", "T(O)") },
    ],
  },
  {
    name: "Mitsubishi",
    models: [
      { name: "Pajero Sport", variants: v("Select Plus", "AT 4x4") },
      { name: "Outlander", variants: v("2.4 AT") },
      { name: "Lancer", variants: v("LXd", "SFXd") },
      { name: "Cedia", variants: v("Select", "Sports") },
    ],
  },
  {
    name: "Isuzu",
    models: [
      { name: "D-Max V-Cross", variants: v("Standard", "High", "Z Prestige") },
      { name: "MU-X 4x4", variants: v("AT") },
    ],
  },
  {
    name: "Force Motors",
    models: [
      { name: "Gurkha", variants: v("3-Door 4x4", "5-Door 4x4") },
      { name: "Urbania", variants: v("10-Seater", "13-Seater", "17-Seater") },
    ],
  },
];

export const extraBikeBrands: VehicleBrand[] = [
  {
    name: "Hero",
    models: [
      { name: "Splendor Plus XTEC", variants: v("Drum", "Disc") },
      { name: "Passion XTEC", variants: v("Drum", "Disc") },
      { name: "Glamour XTEC", variants: v("Drum", "Disc") },
      { name: "Xoom 110", variants: v("VX", "ZX") },
      { name: "Xoom 125", variants: v("Base", "Combat") },
      { name: "Xpulse 210", variants: v("Base", "Pro") },
      { name: "Vida V1", variants: v("Plus", "Pro") },
      { name: "Vida VX2", variants: v("Go", "Plus") },
      { name: "Achiever", variants: v("Drum", "Disc") },
      { name: "Karizma ZMR", variants: v("Standard") },
    ],
  },
  {
    name: "Honda",
    models: [
      { name: "Shine 100", variants: v("Drum") },
      { name: "Livo", variants: v("Drum", "Disc") },
      { name: "SP 160", variants: v("Drum", "Disc") },
      { name: "NX200", variants: v("Standard") },
      { name: "CB350RS", variants: v("Standard", "DLX Pro") },
      { name: "CB1000 Hornet SP", variants: v("Standard") },
      { name: "Activa 125 H-Smart", variants: v("Drum", "Disc") },
      { name: "Activa e", variants: v("Standard") },
      { name: "QC1", variants: v("Standard") },
      { name: "Dio 125", variants: v("Drum", "Disc") },
      { name: "CBR 650R", variants: v("Standard") },
      { name: "CB500X", variants: v("Standard") },
      { name: "Activa 4G", variants: v("Standard") },
    ],
  },
  {
    name: "Bajaj",
    models: [
      { name: "Discover 110", variants: v("Drum", "Disc") },
      { name: "Discover 125", variants: v("Drum", "Disc") },
      { name: "Platina 110", variants: v("ABS", "H-Gear") },
      { name: "Pulsar N125", variants: v("Drum", "Disc") },
      { name: "Pulsar NS125", variants: v("Standard") },
      { name: "Pulsar NS160", variants: v("Standard") },
      { name: "Pulsar N150", variants: v("Standard") },
      { name: "Avenger Street 160", variants: v("Standard") },
      { name: "Avenger Cruise 220", variants: v("Standard") },
      { name: "Chetak 3503", variants: v("Standard") },
      { name: "Chetak 3001", variants: v("Standard") },
      { name: "Pulsar 220F", variants: v("Standard") },
    ],
  },
  {
    name: "TVS",
    models: [
      { name: "Apache RTR 160 4V", variants: v("Drum", "Disc", "Special Edition") },
      { name: "Apache RTR 310", variants: v("Base", "BTO Dynamic", "BTO Dynamic Pro") },
      { name: "Raider 125 iGO", variants: v("Drum", "Disc", "Super Squad") },
      { name: "Ntorq 150", variants: v("Standard") },
      { name: "Jupiter 110", variants: v("Drum", "Disc", "SmartXonnect") },
      { name: "Zest 110", variants: v("Standard", "Himalayan Highs") },
      { name: "Scooty Pep+", variants: v("Standard", "Matte") },
      { name: "iQube ST", variants: v("2.2 kWh", "3.4 kWh", "5.1 kWh") },
      { name: "Orbiter", variants: v("Standard") },
      { name: "XL100", variants: v("Comfort", "Heavy Duty", "Win Edition") },
      { name: "Ronin", variants: v("Base", "Mid", "Top") },
    ],
  },
  {
    name: "Royal Enfield",
    models: [
      { name: "Classic 650", variants: v("Standard", "Chrome") },
      { name: "Goan Classic 350", variants: v("Standard") },
      { name: "Thunderbird 350", variants: v("Standard", "X") },
      { name: "Thunderbird 500", variants: v("Standard", "X") },
      { name: "Electra 350", variants: v("Standard", "Twinspark") },
      { name: "Standard 350", variants: v("Standard") },
      { name: "Himalayan 411", variants: v("BS4", "BS6") },
      { name: "Scrambler 450", variants: v("Standard") },
    ],
  },
  {
    name: "Yamaha",
    models: [
      { name: "FZ V4", variants: v("Standard", "Deluxe") },
      { name: "FZ-S Fi V3", variants: v("Standard", "Dark Knight") },
      { name: "R15 V4", variants: v("Standard", "M") },
      { name: "MT-15 V2", variants: v("Standard", "Dark") },
      { name: "Saluto", variants: v("Drum", "Disc") },
      { name: "SZ-RR", variants: v("V2") },
      { name: "Crux", variants: v("Standard") },
      { name: "Alpha", variants: v("Drum", "Disc") },
      { name: "RayZR Street Rally", variants: v("Hybrid") },
      { name: "XSR 155", variants: v("Standard") },
    ],
  },
  {
    name: "Suzuki",
    models: [
      { name: "Gixxer 150", variants: v("Standard", "Ride Connect") },
      { name: "Access 125 Ride Connect", variants: v("Drum", "Disc") },
      { name: "e-Access", variants: v("Standard") },
      { name: "Burgman Street EX", variants: v("Standard") },
      { name: "Katana", variants: v("Standard") },
      { name: "V-Strom 800DE", variants: v("Standard") },
      { name: "Slingshot", variants: v("Standard", "Plus") },
      { name: "Samurai", variants: v("Standard") },
    ],
  },
  {
    name: "KTM",
    models: [
      { name: "160 Duke", variants: v("Standard") },
      { name: "250 Adventure", variants: v("Standard", "V") },
      { name: "390 Adventure X", variants: v("Standard") },
      { name: "390 SMC R", variants: v("Standard") },
      { name: "RC 390 MotoGP", variants: v("Edition") },
      { name: "790 Duke", variants: v("Standard") },
    ],
  },
  {
    name: "Kawasaki",
    models: [
      { name: "Eliminator 450", variants: v("Standard", "SE") },
      { name: "Z900RS", variants: v("Standard", "Cafe") },
      { name: "Versys 1100", variants: v("Standard", "SE") },
      { name: "KLX 230", variants: v("Standard") },
      { name: "Ninja 1100SX", variants: v("Standard") },
    ],
  },
  {
    name: "Harley-Davidson",
    models: [
      { name: "X440 Denim", variants: v("Standard") },
      { name: "X440 Vivid", variants: v("Standard") },
      { name: "Iron 883", variants: v("Standard") },
      { name: "Forty-Eight", variants: v("Standard") },
      { name: "Street 750", variants: v("Standard", "Rod") },
      { name: "Heritage Classic", variants: v("114") },
    ],
  },
  {
    name: "Triumph",
    models: [
      { name: "Scrambler 400 XC", variants: v("Standard") },
      { name: "Thruxton", variants: v("RS", "Final Edition") },
      { name: "Scrambler 900", variants: v("Standard") },
      { name: "Scrambler 1200", variants: v("X", "XE") },
      { name: "Daytona 660", variants: v("Standard") },
    ],
  },
  {
    name: "Jawa",
    models: [
      { name: "Jawa 42 Bobber", variants: v("Standard", "Black Mirror") },
      { name: "Perak", variants: v("Standard") },
      { name: "Yezdi Roadster 350", variants: v("Standard") },
    ],
  },
  {
    name: "Ather",
    models: [
      { name: "450S", variants: v("Standard") },
      { name: "Rizta S", variants: v("2.9 kWh", "3.7 kWh") },
      { name: "Rizta Z", variants: v("2.9 kWh", "3.7 kWh") },
    ],
  },
  {
    name: "Ola",
    models: [
      { name: "S1 Pro+", variants: v("4 kWh", "5.3 kWh") },
      { name: "S1 Z", variants: v("Standard") },
      { name: "Gig", variants: v("Standard", "Plus") },
    ],
  },
  {
    name: "Vida",
    models: [
      { name: "V1", variants: v("Plus", "Pro") },
      { name: "V2", variants: v("Lite", "Plus", "Pro") },
      { name: "VX2", variants: v("Go", "Plus") },
    ],
  },
  {
    name: "Aprilia",
    models: [
      { name: "SR 125", variants: v("Standard") },
      { name: "SR 160", variants: v("Standard", "Race") },
      { name: "SXR 160", variants: v("Standard") },
      { name: "RS 457", variants: v("Standard") },
      { name: "Tuono 457", variants: v("Standard") },
      { name: "RSV4", variants: v("Factory") },
    ],
  },
  {
    name: "Vespa",
    models: [
      { name: "SXL 125", variants: v("Standard") },
      { name: "VXL 150", variants: v("Standard") },
      { name: "ZX 125", variants: v("Standard") },
      { name: "Dual 125", variants: v("Standard") },
    ],
  },
  {
    name: "BGauss",
    models: [
      { name: "RUV350", variants: v("Max", "Pro") },
      { name: "C12i", variants: v("Max", "EX") },
    ],
  },
  {
    name: "Benelli",
    models: [
      { name: "Imperiale 400", variants: v("Standard") },
      { name: "Leoncino 500", variants: v("Standard", "Trail") },
      { name: "TRK 502", variants: v("Standard", "X") },
      { name: "302R", variants: v("Standard") },
    ],
  },
  {
    name: "Mahindra",
    models: [
      { name: "Centuro", variants: v("Standard", "Rockstar") },
      { name: "Gusto", variants: v("125", "VX") },
      { name: "Mojo", variants: v("300 ABS", "UT300", "XT300") },
    ],
  },
  {
    name: "Yezdi",
    models: [
      { name: "Roadster", variants: v("Standard") },
      { name: "Scrambler", variants: v("Standard") },
      { name: "Adventure", variants: v("Standard") },
    ],
  },
];

export const extraCommercialBrands: VehicleBrand[] = [
  {
    name: "Tata",
    models: [
      { name: "Ace Gold", variants: v("Petrol CX", "Diesel", "CNG", "BiFuel") },
      { name: "Ace EV", variants: v("1000", "1200") },
      { name: "Intra V10", variants: v("Standard") },
      { name: "Intra V30", variants: v("Standard") },
      { name: "Intra V50", variants: v("Standard") },
      { name: "Yodha 2.0", variants: v("4x2", "4x4") },
      { name: "LPT 1109", variants: v("Standard") },
      { name: "LPT 1512", variants: v("Standard") },
      { name: "Signa 1923", variants: v("Standard") },
      { name: "Signa 2823", variants: v("Standard") },
      { name: "Prima 4028", variants: v("Standard") },
      { name: "Winger Cargo", variants: v("Standard", "Staff") },
    ],
  },
  {
    name: "Mahindra",
    models: [
      { name: "Bolero Maxx Pik-Up", variants: v("City", "HD", "1.3T", "1.7T") },
      { name: "Veero", variants: v("Standard", "HD") },
      { name: "Jeeto Plus", variants: v("CNG", "Diesel") },
      { name: "Supro Profit Truck", variants: v("Mini", "Maxi", "Excel") },
      { name: "Furio 7", variants: v("Standard") },
      { name: "Furio 14", variants: v("Standard") },
      { name: "Blazo X 28", variants: v("Standard") },
      { name: "Treo Zor", variants: v("Standard") },
    ],
  },
  {
    name: "Ashok Leyland",
    models: [
      { name: "Dost+", variants: v("Standard", "CNG") },
      { name: "Bada Dost i3", variants: v("Standard") },
      { name: "Bada Dost i4", variants: v("Standard") },
      { name: "Ecomet Star 1115", variants: v("Standard") },
      { name: "Ecomet Star 1615", variants: v("Standard") },
      { name: "Boss 1315", variants: v("Standard") },
      { name: "AVTR 2820", variants: v("Standard") },
      { name: "Switch IeV", variants: v("3", "4") },
    ],
  },
  {
    name: "Eicher",
    models: [
      { name: "Pro 2059", variants: v("Standard") },
      { name: "Pro 2110", variants: v("Standard") },
      { name: "Pro 3019", variants: v("Standard") },
      { name: "Pro 6028", variants: v("Standard") },
      { name: "Skyline Pro Bus", variants: v("School", "Staff") },
    ],
  },
  {
    name: "BharatBenz",
    models: [
      { name: "1015R", variants: v("Standard") },
      { name: "1415R", variants: v("Standard") },
      { name: "1917R", variants: v("Standard") },
      { name: "3532C", variants: v("Standard") },
      { name: "4823TT", variants: v("Standard") },
    ],
  },
  {
    name: "Maruti Suzuki",
    models: [
      { name: "Super Carry CNG", variants: v("Standard") },
      { name: "Eeco Cargo", variants: v("Petrol", "CNG") },
    ],
  },
  {
    name: "Piaggio",
    models: [
      { name: "Ape Xtra LDX", variants: v("Diesel", "CNG") },
      { name: "Ape City+", variants: v("Petrol", "CNG") },
      { name: "Ape E-City FX", variants: v("Standard") },
      { name: "Porter 700", variants: v("Standard") },
      { name: "Porter 1000", variants: v("Standard") },
    ],
  },
  {
    name: "Force",
    models: [
      { name: "Traveller 3350", variants: v("13-Seater", "17-Seater") },
      { name: "Traveller 4020", variants: v("20-Seater", "26-Seater") },
      { name: "Trax Cruiser", variants: v("Standard") },
      { name: "Kargo King", variants: v("Standard") },
    ],
  },
  {
    name: "SML Isuzu",
    models: [
      { name: "Sartaj", variants: v("HG 5252", "GS 5252") },
      { name: "Samrat", variants: v("GS", "HG") },
      { name: "Prestige", variants: v("School Bus", "Staff Bus") },
    ],
  },
  {
    name: "Volvo",
    models: [
      { name: "FM 420", variants: v("Standard") },
      { name: "FMX 460", variants: v("Standard") },
      { name: "9600 Coach", variants: v("Standard") },
    ],
  },
  {
    name: "Scania",
    models: [
      { name: "P 410", variants: v("Standard") },
      { name: "G 460", variants: v("Standard") },
    ],
  },
  {
    name: "Toyota",
    models: [{ name: "Hilux", variants: v("Standard", "High") }],
  },
];

export const getExtraBrands = (vehicleType: string): VehicleBrand[] => {
  switch (vehicleType) {
    case "bike":
      return extraBikeBrands;
    case "commercial":
      return extraCommercialBrands;
    default:
      return extraCarBrands;
  }
};
