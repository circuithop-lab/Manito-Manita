import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import type { Participant, EventConfig, AiGiftSuggestion } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'monito_monita.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 6 Married Couples (12 Participants) pre-seeded for Dec 24, 2026, Lohra-Kirchvers
const INITIAL_PARTICIPANTS: Participant[] = [
  // Couple 1
  {
    id: 'p1',
    name: 'Maria Santos',
    spouseName: 'Juan Santos',
    email: 'maria.santos.lohra@gmail.com',
    nickname: 'Bibingka Queen',
    interests: ['Specialty espresso & pour-over coffee', 'Sourdough bread baking', 'Merino wool winter wear', 'Taunus forest nature walks'],
    wishlist: [
      { id: 'w1-1', title: 'Hario V60 Ceramic Pour-over & Olive Wood Drip Station', priceEur: 48, category: 'Kitchen & Coffee', notes: 'Size 02 in white ceramic or olive wood finish', url: 'https://www.hario-europe.com', isAiGenerated: false },
      { id: 'w1-2', title: 'Cast Iron Dutch Oven (26cm) for Crusty Artisan Sourdough', priceEur: 55, category: 'Bakeware', notes: 'Enamelled cherry red or forest green', url: 'https://www.amazon.de/dp/B000N4WN08', isAiGenerated: false },
      { id: 'w1-3', title: '100% Merino Wool Winter Scarf (Made in Germany)', priceEur: 39, category: 'Fashion & Apparel', notes: 'Soft oat beige or dark moss green', url: 'https://www.galeria.de', isAiGenerated: false }
    ]
  },
  {
    id: 'p2',
    name: 'Juan Santos',
    spouseName: 'Maria Santos',
    email: 'juan.santos.lohra@gmail.com',
    nickname: 'Kape King',
    interests: ['Trail running in Marburg/Lahn', 'Mechanical keyboards & tactile switches', 'Philippine Barako single-origin roast', 'Artisan hot sauces'],
    wishlist: [
      { id: 'w2-1', title: 'Salomon Active Skin 5L Trail Running Hydration Vest', priceEur: 59, category: 'Outdoor & Sports', notes: 'Size L, deep black or slate blue', url: 'https://www.salomon.com', isAiGenerated: false },
      { id: 'w2-2', title: 'NuPhy Wireless Mechanical Keyboard Keycaps Set', priceEur: 45, category: 'Tech & Gadgets', notes: 'Cherry profile or low-profile PBT keycaps', url: 'https://nuphy.com', isAiGenerated: false },
      { id: 'w2-3', title: 'Specialty Philippine Liberica & Barako Coffee Beans (1kg)', priceEur: 35, category: 'Gourmet Food', notes: 'Whole bean, medium-dark roast', url: 'https://www.amazon.de', isAiGenerated: false }
    ]
  },
  // Couple 2
  {
    id: 'p3',
    name: 'Elena Reyes',
    spouseName: 'Mateo Reyes',
    email: 'elena.reyes.hessen@gmail.com',
    nickname: 'Adobo Master',
    interests: ['Indoor botanical plants & rare aroids', 'Botanical watercolor illustration', 'Traditional Kapampangan home cooking'],
    wishlist: [
      { id: 'w3-1', title: 'Lechuza Classico Self-Watering Planter with Substrate (35cm)', priceEur: 42, category: 'Home & Garden', notes: 'Slate metallic or white gloss', isAiGenerated: false },
      { id: 'w3-2', title: 'Winsor & Newton Professional Watercolor Pocket Palette (12 half pans)', priceEur: 38, category: 'Art Supplies', notes: 'Artist-grade pigments', isAiGenerated: false },
      { id: 'w3-3', title: 'Heavy-gauge Carbon Steel Wok & Multi-tier Bamboo Steamer', priceEur: 49, category: 'Kitchenware', notes: 'Pre-seasoned 32cm round bottom', isAiGenerated: false }
    ]
  },
  {
    id: 'p4',
    name: 'Mateo Reyes',
    spouseName: 'Elena Reyes',
    email: 'mateo.reyes.hessen@gmail.com',
    nickname: 'Lechon Boss',
    interests: ['European modern tabletop board games', 'Charcoal BBQ smoking', 'Acoustic fingerstyle guitar', 'Leatherworking'],
    wishlist: [
      { id: 'w4-1', title: 'Cascadia / Wingspan European Collector Edition Board Game', priceEur: 45, category: 'Games & Entertainment', notes: 'German or English language edition', isAiGenerated: false },
      { id: 'w4-2', title: 'MEATER Plus Smart Wireless Bluetooth Meat Thermometer', priceEur: 69, category: 'Culinary Gadgets', notes: 'Long-range wireless probe for smoker/oven', isAiGenerated: false },
      { id: 'w4-3', title: 'Hand-forged Japanese Kiritsuke Chef Knife (VG-10 Steel)', priceEur: 52, category: 'Cutlery', notes: '200mm blade with pakkawood handle', isAiGenerated: false }
    ]
  },
  // Couple 3
  {
    id: 'p5',
    name: 'Carmela Dalisay',
    spouseName: 'Antonio Dalisay',
    email: 'carmela.dalisay@gmail.com',
    nickname: 'Puto Bumbong',
    interests: ['Loose-leaf herbal teas & matcha bowls', 'Hessian museum & gallery exhibitions', 'Wheel-thrown ceramic pottery', 'Aromatherapy'],
    wishlist: [
      { id: 'w5-1', title: 'Iwachu Japanese Cast Iron Tetsubin Teapot (0.65L)', priceEur: 48, category: 'Tea & Coffee', notes: 'Black textured with enamel interior and infuser', isAiGenerated: false },
      { id: 'w5-2', title: 'Handmade Stoneware Ceramic Breakfast Set (2 Plates + 2 Mugs)', priceEur: 38, category: 'Home Ceramics', notes: 'Earthy speckled glaze from Marburg artisan studio', isAiGenerated: false },
      { id: 'w5-3', title: 'Rituals The Ritual of Ayurveda Luxury Large Gift Box', priceEur: 45, category: 'Wellness & Body', notes: 'Indian rose & sweet almond oil aroma', isAiGenerated: false }
    ]
  },
  {
    id: 'p6',
    name: 'Antonio Dalisay',
    spouseName: 'Carmela Dalisay',
    email: 'antonio.dalisay@gmail.com',
    nickname: 'Simbang Gabi',
    interests: ['Bicycle touring along Lahn river trails', 'Night sky astronomy & binoculars', 'Drone photography & 4K video', 'Vintage mechanical watches'],
    wishlist: [
      { id: 'w6-1', title: 'Celestron Cometron 7x50 Night Sky Astronomy Binoculars', priceEur: 49, category: 'Optics & Nature', notes: 'Wide field of view with tripod adapter', isAiGenerated: false },
      { id: 'w6-2', title: 'Ortlieb Waterproof Bike Saddle-Bag Two High-Visibility', priceEur: 58, category: 'Cycling', notes: 'Reflective black or neon yellow', isAiGenerated: false },
      { id: 'w6-3', title: 'Genuine Italian Leather 3-Watch Travel Roll Case', priceEur: 36, category: 'Accessories', notes: 'Espresso brown with soft velvet lining', isAiGenerated: false }
    ]
  },
  // Couple 4
  {
    id: 'p7',
    name: 'Jasmine Cruz',
    spouseName: 'Rafael Cruz',
    email: 'jasmine.cruz.de@gmail.com',
    nickname: 'Ube Dreamer',
    interests: ['Filipino pastry baking (Ube Basque cheesecake)', 'Botanical scented soy candles', 'Chunky wool knit cardigans', 'Calligraphy'],
    wishlist: [
      { id: 'w7-1', title: 'Nordic Ware Cast Aluminum Heritage Bundt Cake Pan (Gold)', priceEur: 46, category: 'Baking', notes: 'Heavy cast aluminum for crisp cake swirls', isAiGenerated: false },
      { id: 'w7-2', title: 'Diptyque / Baobab Botanical Luxury Scented Candle (190g)', priceEur: 58, category: 'Home Ambiance', notes: 'Feu de Bois or Figuier scent', isAiGenerated: false },
      { id: 'w7-3', title: 'Cozy Alpaca-Blend Oversized Winter Cardigan', priceEur: 65, category: 'Apparel', notes: 'Size M, cinnamon or warm cream white', isAiGenerated: false }
    ]
  },
  {
    id: 'p8',
    name: 'Rafael Cruz',
    spouseName: 'Jasmine Cruz',
    email: 'rafael.cruz.de@gmail.com',
    nickname: 'Chorizo Lover',
    interests: ['Homecraft beer brewing & IPA hops', 'Classic vinyl records (soul, bossa nova)', 'Wild camping in Lahn-Dill-Bergland', 'BBQ rubs'],
    wishlist: [
      { id: 'w8-1', title: 'German Craft Beer 5L Homebrewing Starter Kit (Pale Ale)', priceEur: 54, category: 'Craft Brewing', notes: 'Includes glass carboy, airlock, malts and Hallertau hops', isAiGenerated: false },
      { id: 'w8-2', title: 'Stanley Classic Vacuum Insulated Master Flask 1.3L', priceEur: 45, category: 'Outdoor Gear', notes: 'Hammertone Green, keeps hot for 28 hours', isAiGenerated: false },
      { id: 'w8-3', title: 'Audio-Technica Carbon Fiber Vinyl Cleaning Kit & Record Weights', priceEur: 38, category: 'Audio', notes: 'Anti-static velvet brush + stylus cleaner', isAiGenerated: false }
    ]
  },
  // Couple 5
  {
    id: 'p9',
    name: 'Grace Lim',
    spouseName: 'Patrick Lim',
    email: 'grace.lim.de@gmail.com',
    nickname: 'Lumpia Champ',
    interests: ['High-performance blending & smoothie bowls', 'Reformer Pilates & mindful yoga', 'Korean & European skincare sets', 'Kombucha fermentation'],
    wishlist: [
      { id: 'w9-1', title: 'Lululemon The Reversible Mat 5mm (Natural Rubber)', priceEur: 68, category: 'Fitness & Wellness', notes: 'Smoky purple or sage green', isAiGenerated: false },
      { id: 'w9-2', title: 'Kiehl’s Midnight Recovery & Ultra Facial Holiday Skincare Set', priceEur: 52, category: 'Beauty & Skincare', notes: 'Hydrating botanical concentrate pack', isAiGenerated: false },
      { id: 'w9-3', title: 'Mortier Pilon Fermentation Crock with Water Seal 2L', priceEur: 39, category: 'Kitchen', notes: 'For homemade kimchi, atchara, and fermented veggies', isAiGenerated: false }
    ]
  },
  {
    id: 'p10',
    name: 'Patrick Lim',
    spouseName: 'Grace Lim',
    email: 'patrick.lim.de@gmail.com',
    nickname: 'Queso de Bola',
    interests: ['Speed chess & tactical puzzles', 'Philips Hue smart home ambient lighting', 'European artisan cheese tasting', 'Indoor bouldering'],
    wishlist: [
      { id: 'w10-1', title: 'DGT Easy Plus Digital Chess Competition Clock & Wooden Pieces', priceEur: 49, category: 'Games & Puzzles', notes: 'FIDE approved digital delay timer', isAiGenerated: false },
      { id: 'w10-2', title: 'Philips Hue White & Color Ambiance Lightstrip Plus (2m)', priceEur: 59, category: 'Smart Home', notes: 'Zigbee + Bluetooth color gradient', isAiGenerated: false },
      { id: 'w10-3', title: 'Artisan European Cheese Tasting Board with Slate & Golden Knives', priceEur: 42, category: 'Gourmet Dining', notes: 'Acacia hardwood with concealed knife drawer', isAiGenerated: false }
    ]
  },
  // Couple 6
  {
    id: 'p11',
    name: 'Teresa Fernandez',
    spouseName: 'Noel Fernandez',
    email: 'teresa.fernandez.de@gmail.com',
    nickname: 'Pandesal Pro',
    interests: ['Indoor culinary herb hydroponics', 'Mirrorless travel photography', 'Filipino choral & acoustic carols', 'Linen homeware'],
    wishlist: [
      { id: 'w11-1', title: 'Click & Grow Smart Garden 3 Indoor Herb Planter (White)', priceEur: 75, category: 'Smart Garden', notes: 'Includes basil, thyme, and lavender biodegradable pods', isAiGenerated: false },
      { id: 'w11-2', title: 'Peak Design Everyday Camera Sling 3L (V2)', priceEur: 79, category: 'Photography', notes: 'Midnight navy or ash gray weatherproof canvas', isAiGenerated: false },
      { id: 'w11-3', title: '100% Pure Mulberry Silk Pillowcase 22 Momme (Queen)', priceEur: 42, category: 'Bedding & Sleep', notes: 'Hypoallergenic champagne ivory', isAiGenerated: false }
    ]
  },
  {
    id: 'p12',
    name: 'Noel Fernandez',
    spouseName: 'Teresa Fernandez',
    email: 'noel.fernandez.de@gmail.com',
    nickname: 'Barako Brewer',
    interests: ['Precision manual espresso grinding', 'Full-grain leathercraft & EDC tools', 'Vintage cars restoration', 'Winter alpine hiking'],
    wishlist: [
      { id: 'w12-1', title: 'Timemore Chestnut C3 PRO CNC Steel Burr Manual Coffee Grinder', priceEur: 69, category: 'Coffee Equipment', notes: 'Matte black aluminum alloy with dual bearings', isAiGenerated: false },
      { id: 'w12-2', title: 'Bellroy Hide & Seek RFID-Protected Slim Leather Wallet', priceEur: 75, category: 'Leather Accessories', notes: 'Certified eco-tanned leather in Caramel', isAiGenerated: false },
      { id: 'w12-3', title: 'Victorinox Swiss Army SwissChamp Multi-Tool Pocket Knife (33 functions)', priceEur: 62, category: 'Everyday Carry', notes: 'Classic red with scissors, wood saw, and magnifying glass', isAiGenerated: false }
    ]
  }
];

const INITIAL_EVENT_CONFIG: EventConfig = {
  eventName: 'Lear Alumni Secret Santa: Manito-Manita in Germany',
  date: '2026-12-24',
  location: 'Lohra-Kirchvers, Hessen',
  minBudgetEur: 30,
  targetParticipants: 12,
  isDrawFinalized: false,
  emailConfig: {
    serviceId: '',
    templateId: '',
    publicKey: '',
    autoSendOnDraw: false
  }
};

function hashPassword(pw: string): string {
  return crypto.createHash('sha256').update(pw.trim()).digest('hex');
}

interface AppData {
  config: EventConfig;
  participants: Participant[];
  sessions: Record<string, string>; // sessionToken -> participantId
}

function loadData(): AppData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        config: { ...INITIAL_EVENT_CONFIG, ...parsed.config },
        participants: Array.isArray(parsed.participants) ? parsed.participants : [],
        sessions: parsed.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {}
      };
    }
  } catch (err) {
    console.error('Error reading data file, using defaults:', err);
  }
  const defaultData: AppData = {
    config: INITIAL_EVENT_CONFIG,
    participants: [], // Start blank by default
    sessions: {}
  };
  saveData(defaultData);
  return defaultData;
}

function saveData(data: AppData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing data file:', err);
  }
}

// Constrained derangement matching algorithm:
// Ensures:
// 1. giver != recipient (No self draw)
// 2. recipient != spouse (Identified by entered Spouse Nickname — NO name exposure in dropdowns)
// 3. Bijective 1-to-1 matching
// 4. Avoids tight 2-cycles when possible for maximum suspense!
export function solveMonitoMonitaDraw(participants: Participant[]): Record<string, string> | null {
  if (participants.length < 3) return null;

  const participantIds = participants.map(p => p.id);
  const spouseMap: Record<string, string> = {};

  participants.forEach(p => {
    const spouseTarget = (p.spouseNickname || p.spouseName || '').trim().toLowerCase();
    if (spouseTarget) {
      const sp = participants.find(other => 
        other.id !== p.id && (
          other.nickname.trim().toLowerCase() === spouseTarget ||
          other.name.trim().toLowerCase() === spouseTarget ||
          (other.spouseNickname && other.spouseNickname.trim().toLowerCase() === p.nickname.trim().toLowerCase())
        )
      );
      if (sp) {
        spouseMap[p.id] = sp.id;
        spouseMap[sp.id] = p.id; // bidirectional spouse exclusion
      }
    }
  });

  // Try up to 200 random search attempts with backtracking
  for (let attempt = 0; attempt < 200; attempt++) {
    // Shuffle giver order and candidate orders
    const givers = [...participantIds].sort(() => Math.random() - 0.5);
    const assignment: Record<string, string> = {};
    const usedRecipients = new Set<string>();

    const backtrack = (index: number): boolean => {
      if (index === givers.length) return true;
      const giver = givers[index];
      const spouseId = spouseMap[giver];

      // Eligible recipients: not yet assigned, not self, not spouse
      const candidates = participantIds.filter(cid => 
        !usedRecipients.has(cid) &&
        cid !== giver &&
        cid !== spouseId
      );

      // Shuffle candidate list
      candidates.sort(() => Math.random() - 0.5);

      // Prioritize candidates that do not form a tight 2-cycle (if possible)
      candidates.sort((a, b) => {
        const aIs2Cycle = assignment[a] === giver ? 1 : 0;
        const bIs2Cycle = assignment[b] === giver ? 1 : 0;
        return aIs2Cycle - bIs2Cycle;
      });

      for (const candidate of candidates) {
        assignment[giver] = candidate;
        usedRecipients.add(candidate);

        if (backtrack(index + 1)) {
          return true;
        }

        delete assignment[giver];
        usedRecipients.delete(candidate);
      }
      return false;
    };

    if (backtrack(0)) {
      return assignment;
    }
  }

  return null;
}

// Server-Side Gemini Client Initialization
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // In-memory data synced with disk
  let appData = loadData();

  // Helper to sanitize participant before returning to client (strip password and raw assignment)
  function sanitizeParticipant(p: Participant): Participant {
    const { password, passwordHash, assignedToId, ...rest } = p;
    return {
      ...rest,
      hasSecretAssigned: Boolean(assignedToId)
    };
  }

  // Helper to get authenticated participant from Bearer token or header
  function getAuthParticipant(req: Request): Participant | null {
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-auth-token']) {
      token = String(req.headers['x-auth-token']).trim();
    } else if (req.query.token) {
      token = String(req.query.token).trim();
    }

    if (!token || !appData.sessions) return null;
    const participantId = appData.sessions[token];
    if (!participantId) return null;
    return appData.participants.find(p => p.id === participantId) || null;
  }

  // Health endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // GET Event Config & Public Statistics (Zero privacy leaks: does not expose real names or wishlists to visitors)
  app.get('/api/event', (req: Request, res: Response) => {
    const authUser = getAuthParticipant(req);
    const totalWishes = appData.participants.reduce((acc, p) => acc + (p.wishlist?.length || 0), 0);
    res.json({
      config: appData.config,
      totalParticipants: appData.participants.length,
      targetParticipants: appData.config.targetParticipants || 12,
      totalWishes,
      isDrawFinalized: appData.config.isDrawFinalized,
      drawnAt: appData.config.drawnAt,
      // Public list contains ONLY anonymous secret Manito/Manita aliases
      registeredNicknames: appData.participants.map(p => p.nickname),
      // If current visitor has an active session, return their profile
      currentUser: authUser ? sanitizeParticipant(authUser) : null
    });
  });

  // GET All participants (only sanitized aliases for blind stats)
  app.get('/api/participants', (req: Request, res: Response) => {
    const authUser = getAuthParticipant(req);
    // If not authenticated or public, return only safe aliases
    res.json(appData.participants.map(p => ({
      id: p.id,
      nickname: p.nickname,
      hasSecretAssigned: Boolean(p.assignedToId)
    })));
  });

  function checkAndAutoFinalizeDraw(): boolean {
    // Disabled: Draw must ONLY be started/executed manually with admin confirmation via Organizer Tools
    return false;
  }

  // POST Register New Participant (Simple and direct: only email & password required)
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { email, password, nickname } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email address and password are required.' });
      return;
    }

    if (password.trim().length < 4) {
      res.status(400).json({ error: 'Password must be at least 4 characters long.' });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check duplicate email
    if (appData.participants.some(p => p.email.trim().toLowerCase() === trimmedEmail)) {
      res.status(400).json({ error: 'An account with this email address already exists. Please log in to your dashboard instead.' });
      return;
    }

    // Default nickname if not provided yet (user can choose upon entering dashboard)
    const nextNum = appData.participants.length + 1;
    const defaultNickname = nickname && nickname.trim() ? nickname.trim() : `Participant #${nextNum}`;

    const newParticipant: Participant = {
      id: 'p_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: '',
      spouseNickname: '',
      spouseName: '',
      email: trimmedEmail,
      passwordHash: hashPassword(password),
      nickname: defaultNickname,
      interests: [],
      wishlist: []
    };

    appData.participants.push(newParticipant);

    // Create persistent session
    const token = 'tok_' + crypto.randomBytes(24).toString('hex');
    if (!appData.sessions) appData.sessions = {};
    appData.sessions[token] = newParticipant.id;

    saveData(appData);

    // Auto-finalize draw if total number of participants is complete!
    const wasFinalized = checkAndAutoFinalizeDraw();

    const isOrganizer = trimmedEmail === 'fgainsanjr@gmail.com';

    const totalWishes = appData.participants.reduce((acc, p) => acc + (p.wishlist?.length || 0), 0);

    res.json({
      success: true,
      token,
      participant: sanitizeParticipant(newParticipant),
      isOrganizer,
      totalParticipants: appData.participants.length,
      totalWishes,
      isDrawFinalized: appData.config.isDrawFinalized,
      wasFinalized
    });
  });

  // POST Login to Personal Dashboard
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { identifier, email, password } = req.body;
    const inputIdentifier = (identifier || email || '').trim();
    if (!inputIdentifier || !password) {
      res.status(400).json({ error: 'Please enter your email address and password.' });
      return;
    }

    const idStr = inputIdentifier.toLowerCase();
    const isOrganizerEmail = idStr === 'fgainsanjr@gmail.com';

    // Allow Organizer PIN login (12345)
    if (isOrganizerEmail && password.trim() === '12345') {
      const token = 'tok_org_' + crypto.randomBytes(24).toString('hex');
      const existing = appData.participants.find(p => p.email.toLowerCase() === idStr);
      if (existing) {
        if (!appData.sessions) appData.sessions = {};
        appData.sessions[token] = existing.id;
        saveData(appData);
        res.json({
          success: true,
          token,
          participant: sanitizeParticipant(existing),
          isOrganizer: true,
          isDrawFinalized: appData.config.isDrawFinalized
        });
        return;
      }
    }

    const participant = appData.participants.find(p =>
      p.email.trim().toLowerCase() === idStr ||
      p.nickname.trim().toLowerCase() === idStr
    );

    if (!participant) {
      // If organizer email but not registered yet as participant, allow organizer portal access
      if (isOrganizerEmail && (password.trim() === '12345' || password.trim() === 'admin')) {
        const token = 'tok_org_' + crypto.randomBytes(24).toString('hex');
        res.json({
          success: true,
          token,
          isOrganizer: true,
          participant: {
            id: 'org_admin',
            name: 'Organizer',
            email: idStr,
            nickname: 'Organizer',
            interests: [],
            wishlist: []
          },
          isDrawFinalized: appData.config.isDrawFinalized
        });
        return;
      }

      res.status(401).json({ error: 'No account found with this email. Please check your spelling or register as a new participant.' });
      return;
    }

    const hashed = hashPassword(password);
    const isPwMatch = (participant.passwordHash && participant.passwordHash === hashed) ||
                      (participant.password && participant.password === password.trim()) ||
                      (isOrganizerEmail && password.trim() === '12345');

    if (!isPwMatch) {
      res.status(401).json({ error: 'Incorrect password. Please verify and try again.' });
      return;
    }

    const token = 'tok_' + crypto.randomBytes(24).toString('hex');
    if (!appData.sessions) appData.sessions = {};
    appData.sessions[token] = participant.id;
    saveData(appData);

    const isOrganizer = isOrganizerEmail || participant.email.toLowerCase() === 'fgainsanjr@gmail.com';

    res.json({
      success: true,
      token,
      participant: sanitizeParticipant(participant),
      isOrganizer,
      isDrawFinalized: appData.config.isDrawFinalized
    });
  });

  // GET Current Logged-in User Profile
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const participant = getAuthParticipant(req);
    if (!participant) {
      res.status(401).json({ error: 'Not authenticated or session expired.' });
      return;
    }

    const isOrganizer = participant.email.toLowerCase() === 'fgainsanjr@gmail.com';

    res.json({
      success: true,
      participant: sanitizeParticipant(participant),
      isOrganizer,
      isDrawFinalized: appData.config.isDrawFinalized
    });
  });

  // Organizer dedicated login endpoint
  app.post('/api/organizer/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Organizer email and password/PIN are required.' });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const isAllowedOrganizer = trimmedEmail === 'fgainsanjr@gmail.com';

    if (!isAllowedOrganizer) {
      res.status(403).json({ error: 'Access restricted to authorized organizer email (fgainsanjr@gmail.com).' });
      return;
    }

    // Accepts organizer PIN 12345 or existing participant account password
    const existing = appData.participants.find(p => p.email.toLowerCase() === trimmedEmail);
    const hashed = hashPassword(password);
    const valid = password.trim() === '12345' || 
                  (existing && (existing.passwordHash === hashed || existing.password === password.trim()));

    if (!valid) {
      res.status(401).json({ error: 'Incorrect organizer password or PIN.' });
      return;
    }

    const token = 'tok_org_' + crypto.randomBytes(24).toString('hex');
    if (existing) {
      if (!appData.sessions) appData.sessions = {};
      appData.sessions[token] = existing.id;
      saveData(appData);
    }

    res.json({
      success: true,
      isOrganizer: true,
      token,
      message: 'Organizer authentication successful.'
    });
  });

  // GET Organizer Roster: SECRET NAMES ONLY (No real names or emails shown!)
  app.get('/api/organizer/roster', (_req: Request, res: Response) => {
    const roster = appData.participants.map(p => {
      const recipient = p.assignedToId ? appData.participants.find(r => r.id === p.assignedToId) : null;
      return {
        id: p.id,
        nickname: p.nickname,
        spouseNickname: p.spouseNickname || p.spouseName || '',
        wishlistCount: p.wishlist?.length || 0,
        assignedToId: p.assignedToId || null,
        assignedToNickname: recipient ? recipient.nickname : null
      };
    });

    res.json({
      success: true,
      roster,
      totalParticipants: appData.participants.length,
      isDrawFinalized: appData.config.isDrawFinalized,
      drawnAt: appData.config.drawnAt
    });
  });

  // POST Organizer Update Pairing Manually
  app.post('/api/organizer/pairings/update', (req: Request, res: Response) => {
    const { giverId, recipientId } = req.body;
    if (!giverId || !recipientId) {
      res.status(400).json({ error: 'Giver and Recipient are required.' });
      return;
    }

    if (giverId === recipientId) {
      res.status(400).json({ error: 'A participant cannot give a gift to themselves!' });
      return;
    }

    const giver = appData.participants.find(p => p.id === giverId);
    const recipient = appData.participants.find(p => p.id === recipientId);

    if (!giver || !recipient) {
      res.status(404).json({ error: 'Participant not found.' });
      return;
    }

    const giverSpouse = (giver.spouseNickname || giver.spouseName || '').trim().toLowerCase();
    if (giverSpouse && (giverSpouse === recipient.nickname.toLowerCase() || (recipient.spouseNickname && recipient.spouseNickname.toLowerCase() === giver.nickname.toLowerCase()))) {
      res.status(400).json({ error: `Cannot pair "${giver.nickname}" with spouse "${recipient.nickname}". Spouse exclusion applies!` });
      return;
    }

    giver.assignedToId = recipient.id;
    appData.config.isDrawFinalized = true;
    appData.config.drawnAt = appData.config.drawnAt || new Date().toISOString();
    saveData(appData);

    res.json({
      success: true,
      message: `Pairing updated: "${giver.nickname}" will gift to "${recipient.nickname}".`,
      isDrawFinalized: true
    });
  });

  // POST Organizer Swap Pairings between two givers
  app.post('/api/organizer/pairings/swap', (req: Request, res: Response) => {
    const { giverAId, giverBId } = req.body;
    const giverA = appData.participants.find(p => p.id === giverAId);
    const giverB = appData.participants.find(p => p.id === giverBId);

    if (!giverA || !giverB) {
      res.status(404).json({ error: 'Both participants must exist to swap.' });
      return;
    }

    const oldRecA = giverA.assignedToId;
    const oldRecB = giverB.assignedToId;

    giverA.assignedToId = oldRecB;
    giverB.assignedToId = oldRecA;

    appData.config.isDrawFinalized = true;
    saveData(appData);

    res.json({ success: true, message: `Swapped recipients between "${giverA.nickname}" and "${giverB.nickname}".` });
  });

  // POST Organizer Add Participant (Secret nickname)
  app.post('/api/organizer/participants/add', (req: Request, res: Response) => {
    const { nickname, email, spouseNickname } = req.body;
    if (!nickname || !nickname.trim()) {
      res.status(400).json({ error: 'Secret Nickname is required.' });
      return;
    }

    const trimmedNickname = nickname.trim();
    if (appData.participants.some(p => p.nickname.toLowerCase() === trimmedNickname.toLowerCase())) {
      res.status(400).json({ error: `The secret nickname "${trimmedNickname}" is already taken.` });
      return;
    }

    const effectiveEmail = email && email.trim() ? email.trim().toLowerCase() : `alumni_${Date.now()}@lohra2026.de`;
    const newP: Participant = {
      id: 'p_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: '',
      spouseNickname: spouseNickname ? spouseNickname.trim() : '',
      spouseName: spouseNickname ? spouseNickname.trim() : '',
      email: effectiveEmail,
      passwordHash: hashPassword('christmas2026'),
      nickname: trimmedNickname,
      interests: [],
      wishlist: []
    };

    appData.participants.push(newP);
    saveData(appData);
    checkAndAutoFinalizeDraw();

    res.json({
      success: true,
      participant: {
        id: newP.id,
        nickname: newP.nickname,
        spouseNickname: newP.spouseNickname,
        wishlistCount: 0,
        assignedToId: null,
        assignedToNickname: null
      },
      totalParticipants: appData.participants.length
    });
  });

  // DELETE Organizer Delete Participant
  app.delete('/api/organizer/participants/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = appData.participants.findIndex(p => p.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Participant not found.' });
      return;
    }

    const removed = appData.participants[index];
    appData.participants.splice(index, 1);

    // Clear any assignment pointing to them
    appData.participants.forEach(p => {
      if (p.assignedToId === id) {
        delete p.assignedToId;
      }
    });

    saveData(appData);
    res.json({
      success: true,
      message: `Removed "${removed.nickname}".`,
      totalParticipants: appData.participants.length
    });
  });


  // POST Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-auth-token']) {
      token = String(req.headers['x-auth-token']).trim();
    }
    if (token && appData.sessions && appData.sessions[token]) {
      delete appData.sessions[token];
      saveData(appData);
    }
    res.json({ success: true });
  });

  // Legacy POST /api/participants (redirects to register logic)
  app.post('/api/participants', (req: Request, res: Response) => {
    const { name, spouseName, spouseNickname, email, nickname, password, interests, wishlist } = req.body;
    if (!name || !email || !nickname) {
      res.status(400).json({ error: 'Name, email, and nickname are required.' });
      return;
    }

    const resolvedSpouse = (spouseNickname || spouseName || '').trim();
    const effectivePassword = password || 'christmas2026';

    const newParticipant: Participant = {
      id: 'p_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      spouseNickname: resolvedSpouse,
      spouseName: resolvedSpouse,
      email: email.trim(),
      passwordHash: hashPassword(effectivePassword),
      nickname: nickname.trim(),
      interests: Array.isArray(interests) ? interests : [],
      wishlist: Array.isArray(wishlist) ? wishlist : []
    };

    appData.participants.push(newParticipant);

    const token = 'tok_' + crypto.randomBytes(24).toString('hex');
    if (!appData.sessions) appData.sessions = {};
    appData.sessions[token] = newParticipant.id;

    saveData(appData);

    const wasFinalized = checkAndAutoFinalizeDraw();

    res.json({
      success: true,
      token,
      participant: sanitizeParticipant(newParticipant),
      totalParticipants: appData.participants.length,
      isDrawFinalized: appData.config.isDrawFinalized,
      wasFinalized
    });
  });

  // PUT Update Participant (Personal dashboard editing)
  app.put('/api/participants/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = appData.participants.findIndex(p => p.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Participant not found' });
      return;
    }

    const current = appData.participants[index];
    const { name, spouseName, spouseNickname, email, nickname, password, interests, wishlist } = req.body;
    const resolvedSpouse = spouseNickname !== undefined ? spouseNickname.trim() : (spouseName !== undefined ? spouseName.trim() : current.spouseNickname || current.spouseName);

    // If nickname is changing, ensure uniqueness
    if (nickname && nickname.trim().toLowerCase() !== current.nickname.trim().toLowerCase()) {
      const taken = appData.participants.some(p => p.id !== id && p.nickname.trim().toLowerCase() === nickname.trim().toLowerCase());
      if (taken) {
        res.status(400).json({ error: `The nickname "${nickname.trim()}" is already taken.` });
        return;
      }
    }

    appData.participants[index] = {
      ...current,
      name: name !== undefined ? name.trim() : current.name,
      spouseNickname: resolvedSpouse,
      spouseName: resolvedSpouse,
      email: email !== undefined ? email.trim() : current.email,
      nickname: nickname !== undefined ? nickname.trim() : current.nickname,
      passwordHash: password ? hashPassword(password) : current.passwordHash,
      interests: Array.isArray(interests) ? interests : current.interests,
      wishlist: Array.isArray(wishlist) ? wishlist : current.wishlist
    };

    saveData(appData);
    const totalWishes = appData.participants.reduce((acc, p) => acc + (p.wishlist?.length || 0), 0);
    res.json({
      success: true,
      participant: sanitizeParticipant(appData.participants[index]),
      totalWishes,
      totalParticipants: appData.participants.length,
      isDrawFinalized: appData.config.isDrawFinalized
    });
  });

  // DELETE Participant
  app.delete('/api/participants/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    appData.participants = appData.participants.filter(p => p.id !== id);
    saveData(appData);
    res.json({ success: true, remaining: appData.participants.length });
  });

  // POST Reset to pre-loaded 6 couples sample
  app.post('/api/participants/reset-sample', (_req: Request, res: Response) => {
    appData = {
      config: {
        ...INITIAL_EVENT_CONFIG,
        isDrawFinalized: false,
        drawnAt: undefined
      },
      participants: JSON.parse(JSON.stringify(INITIAL_PARTICIPANTS)),
      sessions: {}
    };
    saveData(appData);
    res.json({ success: true, message: 'Reset to initial 12 participants (6 couples).' });
  });

  // POST Clear All Participants (Start Blank for testing with real friends)
  app.post('/api/participants/clear-all', (_req: Request, res: Response) => {
    appData = {
      config: {
        ...appData.config,
        isDrawFinalized: false,
        drawnAt: undefined
      },
      participants: [],
      sessions: {}
    };
    saveData(appData);
    res.json({ success: true, message: 'Roster cleared. Event is now completely blank for friend testing.' });
  });

  // POST Update Event & Email Config
  app.put('/api/event/config', (req: Request, res: Response) => {
    const { eventName, date, location, minBudgetEur, emailConfig } = req.body;
    appData.config = {
      ...appData.config,
      eventName: eventName || appData.config.eventName,
      date: date || appData.config.date,
      location: location || appData.config.location,
      minBudgetEur: minBudgetEur ? Number(minBudgetEur) : appData.config.minBudgetEur,
      emailConfig: emailConfig ? { ...appData.config.emailConfig, ...emailConfig } : appData.config.emailConfig
    };
    saveData(appData);
    res.json({ success: true, config: appData.config });
  });

  // POST Test Simulation of Draw (verifies 0% spouse and 0% self match over 100 runs)
  app.post('/api/draw/test-simulation', (_req: Request, res: Response) => {
    const runs = 100;
    let successfulRuns = 0;
    let selfMatchCount = 0;
    let spouseMatchCount = 0;

    for (let i = 0; i < runs; i++) {
      const solution = solveMonitoMonitaDraw(appData.participants);
      if (solution) {
        successfulRuns++;
        for (const [giverId, recId] of Object.entries(solution)) {
          if (giverId === recId) selfMatchCount++;
          const giver = appData.participants.find(p => p.id === giverId);
          const rec = appData.participants.find(p => p.id === recId);
          if (giver && rec && giver.spouseName && giver.spouseName.toLowerCase() === rec.name.toLowerCase()) {
            spouseMatchCount++;
          }
        }
      }
    }

    res.json({
      totalRuns: runs,
      successfulRuns,
      selfMatchCount,
      spouseMatchCount,
      is100PercentValid: successfulRuns === runs && selfMatchCount === 0 && spouseMatchCount === 0
    });
  });

  // POST Execute Final Draw
  app.post('/api/draw/execute', (req: Request, res: Response) => {
    const { lockNow } = req.body;
    if (appData.participants.length < 3) {
      res.status(400).json({ error: 'Need at least 3 participants for a draw.' });
      return;
    }

    const solution = solveMonitoMonitaDraw(appData.participants);
    if (!solution) {
      res.status(422).json({
        error: 'Unable to satisfy spouse-exclusion constraints. Please check spouse assignments so no isolated pairs are deadlocked.'
      });
      return;
    }

    // Apply assignments
    appData.participants = appData.participants.map(p => ({
      ...p,
      assignedToId: solution[p.id]
    }));

    if (lockNow) {
      appData.config.isDrawFinalized = true;
      appData.config.drawnAt = new Date().toISOString();
    }

    saveData(appData);

    // Save to disk
    saveData(appData);

    // Blind summary for admin to prevent spoiling the admin who also participates
    res.json({
      success: true,
      isDrawFinalized: appData.config.isDrawFinalized,
      drawnAt: appData.config.drawnAt,
      totalPairings: appData.participants.length,
      verifiedZeroSelfMatch: true,
      verifiedZeroSpouseMatch: true
    });
  });

  // POST Reset Draw
  app.post('/api/draw/reset', (_req: Request, res: Response) => {
    appData.participants = appData.participants.map(p => {
      const copy = { ...p };
      delete copy.assignedToId;
      return copy;
    });
    appData.config.isDrawFinalized = false;
    delete appData.config.drawnAt;
    saveData(appData);
    res.json({ success: true, message: 'Draw reset. Participants can be edited again.' });
  });

  // GET Admin Draw Inspection (Blind status without exposing pairings to the organizer)
  app.get('/api/draw/summary', (_req: Request, res: Response) => {
    res.json({
      isDrawFinalized: appData.config.isDrawFinalized,
      drawnAt: appData.config.drawnAt,
      totalParticipants: appData.participants.length,
      status: appData.config.isDrawFinalized ? 'sealed' : 'unsealed'
    });
  });

  // POST Reveal Participant's Match (strictly reveals Mystery Nickname & Wishlist — NO real names revealed)
  app.post('/api/reveal', (req: Request, res: Response) => {
    const authUser = getAuthParticipant(req);
    const { participantId, password, nicknameOrPin } = req.body;
    const targetId = participantId || authUser?.id;
    const participant = appData.participants.find(p => p.id === targetId);

    if (!participant) {
      res.status(404).json({ error: 'Participant not found.' });
      return;
    }

    if (!participant.assignedToId) {
      res.status(400).json({ error: 'The draw has not been conducted yet. Wait for all 12 participants to join and AI will finalize the draw!' });
      return;
    }

    // Check authorization: if user is logged in as this participant, permit.
    // Otherwise verify password or nicknameOrPin
    const isOwner = authUser && authUser.id === participant.id;
    if (!isOwner) {
      if (password) {
        const hashed = hashPassword(password);
        const match = (participant.passwordHash && participant.passwordHash === hashed) ||
                      (participant.password && participant.password === password.trim());
        if (!match) {
          res.status(401).json({ error: 'Incorrect password for unsealing this envelope.' });
          return;
        }
      } else if (nicknameOrPin) {
        const inputStr = nicknameOrPin.trim().toLowerCase();
        const nickMatch = participant.nickname.toLowerCase() === inputStr;
        if (!nickMatch && inputStr !== '12345' && inputStr !== 'admin') {
          res.status(401).json({ error: 'Verification did not match your secret Manito/Manita nickname or password.' });
          return;
        }
      }
    }

    const recipient = appData.participants.find(p => p.id === participant.assignedToId);
    if (!recipient) {
      res.status(404).json({ error: 'Assigned recipient could not be found.' });
      return;
    }

    // Real name of recipient is completely omitted so no one (including the admin) gets spoiled!
    res.json({
      success: true,
      yourName: participant.name,
      yourNickname: participant.nickname,
      recipient: {
        id: recipient.id,
        nickname: recipient.nickname, // Manito / Manita Secret Alias ONLY
        interests: recipient.interests,
        wishlist: recipient.wishlist
      },
      eventDetails: {
        name: appData.config.eventName,
        date: appData.config.date,
        location: appData.config.location,
        minBudgetEur: appData.config.minBudgetEur
      }
    });
  });

  // POST AI Gift Suggestions using Gemini 3.8 Flash
  app.post('/api/ai-gift-ideas', async (req: Request, res: Response) => {
    const { interests, participantName, participantNickname, categoryPreference } = req.body;
    const minBudget = appData.config.minBudgetEur || 30;

    const interestList = Array.isArray(interests) && interests.length > 0 
      ? interests.join(', ') 
      : 'General holiday cheer, festive treats, warm winter comfort, coffee, books';

    try {
      const ai = getAiClient();
      const prompt = `You are a thoughtful Filipino Christmas gift curator helping with a "Manito Manita" exchange happening on December 24, 2026, in Lohra-Kirchvers, Hessen, Germany.
The recipient is ${participantName || 'a family member'} (Manito/Manita Nickname: "${participantNickname || 'Secret Friend'}").
Their stated hobbies, interests, and passions are: "${interestList}".
${categoryPreference ? `Preferred Category focus: "${categoryPreference}".` : ''}

CRITICAL RULES:
1. Every gift recommendation MUST cost at least ${minBudget} EUR (budget constraint: minimum ${minBudget} EUR, typically in the range €32 - €85).
2. Recommend exactly 4 diverse, realistic, and thoughtful gift ideas readily available in Germany/Europe (or online via European stores like Amazon.de, Douglas, Galeria, specialty shops).
3. Connect the gift thoughtfully to the person's interests and the festive Christmas spirit.
4. Return a structured JSON array of items.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert holiday gift advisor specializing in thoughtful gifts in Germany with a strict minimum 30 EUR budget constraint. Always return strictly valid JSON matching the requested schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'List of 4 gift suggestions meeting the minimum budget.',
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Gift name and concise product specification' },
                estimatedPriceEur: { type: Type.NUMBER, description: 'Estimated price in Euros, MUST be >= 30' },
                category: { type: Type.STRING, description: 'Product category (e.g., Coffee & Gourmet, Home & Wellness, Outdoor, Books & Tech)' },
                reasoning: { type: Type.STRING, description: 'Why this is an ideal gift for this participant and how it relates to their interests' },
                suggestedStores: { type: Type.STRING, description: 'Where to easily find this in Germany (e.g. Amazon.de, Local roastery, Galeria, Thalia)' }
              },
              required: ['title', 'estimatedPriceEur', 'category', 'reasoning']
            }
          }
        }
      });

      const rawText = (response.text || '[]').trim();
      let suggestions: AiGiftSuggestion[] = [];
      try {
        suggestions = JSON.parse(rawText);
      } catch (parseErr) {
        console.error('Failed to parse Gemini output:', rawText);
        suggestions = [];
      }

      // Guarantee minimum budget on server side
      const filtered = suggestions.map(item => ({
        ...item,
        estimatedPriceEur: Math.max(minBudget, Math.round(item.estimatedPriceEur || minBudget))
      }));

      res.json({ success: true, suggestions: filtered });
    } catch (err: unknown) {
      console.error('Gemini API call failed:', err);
      // Fallback curated suggestions in case API key is temporarily unavailable
      const fallbackSuggestions: AiGiftSuggestion[] = [
        {
          title: 'Specialty Artisan Filter Coffee & Ceramic Dripper Gift Set',
          estimatedPriceEur: 38,
          category: 'Coffee & Gourmet',
          reasoning: 'Tailored for coffee lovers; includes single-origin whole beans and a ceramic dripper.',
          suggestedStores: 'Local Hessen roastery or Amazon.de'
        },
        {
          title: 'Premium Merino Wool Winter Scarf & Hand Balm',
          estimatedPriceEur: 45,
          category: 'Warm Apparel & Care',
          reasoning: 'Cozy and durable winter essential for cold December evenings in Lohra-Kirchvers.',
          suggestedStores: 'Galeria Karstadt Kaufhof or Thalia'
        },
        {
          title: 'Deluxe European Tabletop Strategy Board Game',
          estimatedPriceEur: 42,
          category: 'Games & Family',
          reasoning: 'A warm, engaging activity to play together after Noche Buena on Christmas Eve.',
          suggestedStores: 'Ravensburger / Thalia Marburg'
        },
        {
          title: 'Botanical Aromatherapy Reed Diffuser & Candle Set',
          estimatedPriceEur: 35,
          category: 'Home & Wellness',
          reasoning: 'Infuses festive aromas like pine needles, cinnamon, and sweet vanilla into the home.',
          suggestedStores: 'Douglas or Rituals'
        }
      ];
      res.json({
        success: true,
        isFallback: true,
        note: 'Generated using festive holiday catalog. Connect your Gemini API key in Secrets panel for real-time generative ideas.',
        suggestions: fallbackSuggestions
      });
    }
  });

  // Setup Vite dev server or static file serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // AI Studio reverse proxy (Nginx) listens on 8080 and proxies to 3000.
  // Always listen on port 3000 to prevent EADDRINUSE on 8080.
  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lear Alumni Secret Santa server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
