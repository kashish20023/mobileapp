'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  Phone,
  Lock,
  User,
  Mail,
  Search,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Home,
  ListFilter,
  Compass,
  ArrowRight,
  RefreshCw,
  Zap,
  Bed,
  Bath,
  PhoneCall,
  ChevronLeft,
  Calendar,
  Clock,
  Star,
  Video,
  Sparkles,
  Bot,
  Send,
  Heart,
  Sliders,
  Eye,
  Building2,
  Check,
  X
} from 'lucide-react';

type ScreenType = 'login' | 'dashboard' | 'ai-chat' | 'ai-results' | 'details' | 'wishlist' | 'meetings';

export default function MobileSimulator() {
  const [screen, setScreen] = useState<ScreenType>('login');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auth Form Fields
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [regName, setRegName] = useState('System Tester');
  const [regPhone, setRegPhone] = useState('9999999999');
  const [regEmail, setRegEmail] = useState('tester@example.com');
  const [regPassword, setRegPassword] = useState('password123');
  const [regConfirmPassword, setRegConfirmPassword] = useState('password123');
  const [loginPhone, setLoginPhone] = useState('9999999999');
  const [loginOtp, setLoginOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [mockOtpHint, setMockOtpHint] = useState<string | null>(null);

  // Property & Search State
  const [dashboardProperties, setDashboardProperties] = useState<any[]>([]);
  const [isAiFiltered, setIsAiFiltered] = useState<boolean>(false);
  const [aiQuery, setAiQuery] = useState('Enter your query here');
  const [aiChatMessages, setAiChatMessages] = useState<Array<{
    sender: 'user' | 'ai';
    text: string;
    hasResults?: boolean;
    matchCount?: number;
  }>>([
    { sender: 'ai', text: '👋 Hi! Tell me what property you are looking for, and I will find the best matches for you.' }
  ]);
  const [extractedBadge, setExtractedBadge] = useState<string | null>(null);
  const [activeSearchParams, setActiveSearchParams] = useState<{
    location?: string;
    bhk?: string;
    category?: string;
    facing?: string;
    amenities?: string[];
    nearBy?: string[];
  } | null>(null);
  const [aiResultsProperties, setAiResultsProperties] = useState<any[]>([]);

  // Wishlist State (Array of property IDs or Property objects)
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);

  // Selected Property for Details Page
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);

  // Tour Booking State
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [selectedMeetingType, setSelectedMeetingType] = useState<'SITE_VISIT' | 'VIDEO_CALL'>('SITE_VISIT');
  const [meetingBrokerNote, setMeetingBrokerNote] = useState<string>('');
  const [bookedMeetings, setBookedMeetings] = useState<any[]>([]);

  // Initial Sync
  useEffect(() => {
    const token = api.getToken();
    if (token) {
      setScreen('dashboard');
      fetchDashboardProperties();
      fetchWishlist();
    }
    fetchChatHistory();
  }, []);

  // ── Fetch Chat History ──
  const fetchChatHistory = async () => {
    try {
      const historyRes = await api.request('GET', '/ai/chat/history').catch(() => null);
      const historyList = Array.isArray(historyRes) ? historyRes : historyRes?.data || [];
      if (Array.isArray(historyList) && historyList.length > 0) {
        const formattedMessages = historyList.map((item: any) => ({
          sender: item.sender === 'user' ? ( 'user' as const ) : ( 'ai' as const ),
          text: item.message || item.text || '',
          hasResults: item.sender !== 'user',
        }));
        setAiChatMessages([
          { sender: 'ai', text: '👋 Hi! Tell me what property you are looking for, and I will find the best matches for you.' },
          ...formattedMessages,
        ]);
      }
    } catch (err) {
      // ignore
    }
  };

  const handleReset = () => {
    api.setToken(null);
    setOtpSent(false);
    setLoginOtp('');
    setDashboardProperties([]);
    setWishlistItems([]);
    setError(null);
    setSuccess('Logged out successfully!');
    setScreen('login');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSkipAuth = () => {
    api.setMockFallback(true);
    api.setToken('mock-quick-bypass-token-abc');
    setError(null);
    setSuccess('Logged in via Quick Sandbox Access!');
    setScreen('dashboard');
    fetchDashboardProperties();
    fetchWishlist();
    setTimeout(() => setSuccess(null), 3000);
  };

  // ── Auth Handlers ──
  const onRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setLoading(true);
    try {
      api.setMockFallback(false);
      const payload: any = {
        fullName: regName,
        phone: regPhone,
        password: regPassword,
        confirmPassword: regConfirmPassword,
        role: 'buyer',
      };

      if (regEmail && regEmail.trim()) {
        payload.email = regEmail.trim();
      }
      const res = await api.request('POST', '/auth/register', payload);

      if (res?.accessToken) {
        api.setToken(res.accessToken);
        setSuccess('Account created and logged in successfully!');
        setScreen('dashboard');
        fetchDashboardProperties();
        fetchWishlist();
      } else {
        setSuccess(res?.message || 'Registered successfully! Please send OTP to login.');
        setAuthMode('login');
        setLoginPhone(regPhone);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const onSendOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      api.setMockFallback(false);
      const res = await api.request('POST', '/auth/login/send-otp', { phone: loginPhone });
      setOtpSent(true);
      setSuccess(res?.message || 'OTP sent successfully!');

      const otpCode = res?.otp || res?.otpCode;
      if (otpCode) {
        setMockOtpHint(`Your Login OTP is: ${otpCode}`);
      } else {
        setMockOtpHint(`OTP sent to ${loginPhone}. Check backend console if needed.`);
      }
    } catch (err: any) {
      if (err.message?.includes('Account not found') || err.message?.includes('401')) {
        setError('Account not found with this phone number. Please switch to Register tab to create your buyer account.');
      } else {
        setError(err.message || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      api.setMockFallback(false);
      const res = await api.request('POST', '/auth/login/verify-otp', { phone: loginPhone, otp: loginOtp });
      if (res?.accessToken) {
        api.setToken(res.accessToken);
      }
      setSuccess('Logged in successfully!');
      setScreen('dashboard');
      fetchDashboardProperties();
      fetchWishlist();
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch Properties Feed ──
  const fetchDashboardProperties = async () => {
    try {
      let res = await api.request('GET', '/properties').catch(() => null);
      let list = Array.isArray(res) ? res : res?.items || res?.data || [];

      if (!list || list.length === 0) {
        res = await api.request('GET', '/properties/buyer/matches').catch(() => null);
        list = Array.isArray(res) ? res : res?.items || res?.data || [];
      }
      setDashboardProperties(list);
      setIsAiFiltered(false);
      setExtractedBadge(null);
      setActiveSearchParams(null);
    } catch (err) {
      setDashboardProperties([]);
      setIsAiFiltered(false);
    }
  };

  // ── Wishlist Handlers ──
  const fetchWishlist = async () => {
    try {
      const res = await api.request('GET', '/wishlist').catch(() => null);
      const list = Array.isArray(res) ? res : res?.items || res?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((item: any) => item.property ? item.property : item);
        setWishlistItems(mapped);
      }
    } catch (err) {
      // keep existing
    }
  };

  const toggleWishlist = async (property: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetProp = property.property ? property.property : property;
    const propId = targetProp.id || targetProp.propertyId || property.id;
    const propTitle = targetProp.title || 'Property';

    const isFav = wishlistItems.some((item) => {
      const itemId = item.id || item.propertyId || item.property?.id;
      return itemId === propId;
    });

    try {
      if (isFav) {
        setWishlistItems((prev) => prev.filter((item) => {
          const itemId = item.id || item.propertyId || item.property?.id;
          return itemId !== propId;
        }));
        await api.request('DELETE', `/wishlist/${propId}`).catch(() => { });
        setSuccess(`Removed "${propTitle}" from Wishlist`);
      } else {
        setWishlistItems((prev) => [targetProp, ...prev]);
        await api.request('POST', '/wishlist', { propertyId: propId, property: targetProp }).catch(() => { });
        setSuccess(`Added "${propTitle}" to Wishlist!`);
      }
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      // fallback
    }
  };

  // ── AI Search Submit Handler ──
  const handleAiSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setError(null);
    setLoading(true);

    // Append query to chat history
    const userMsg = aiQuery.trim();
    setAiChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);

    try {
      // 1. Extract preferences using AI
      const aiRes = await api.request('POST', '/ai/preferences/extract', { message: userMsg });
      const prefs = aiRes?.preferences || aiRes || {};

      const isExcludedApartment = /don't show apartment|no flat|no apartment|don't show flat|excluding apartment|excluding flat/i.test(userMsg) || (Array.isArray(prefs.excludedPropertyTypes) && (prefs.excludedPropertyTypes.includes('Apartment') || prefs.excludedPropertyTypes.includes('Flat')));
      const isExcludedVilla = /don't show villa|no villa|not villa|excluding villa/i.test(userMsg) || (Array.isArray(prefs.excludedPropertyTypes) && prefs.excludedPropertyTypes.includes('Villa'));

      let location = prefs.preferredLocation || prefs.location || (Array.isArray(prefs.localities) && prefs.localities.length > 0 ? prefs.localities.join(', ') : '');
      if (location) {
        location = location.replace(/\b\d+(\.\d+)?\b/g, '').trim();
      }
      if (!location || location.length < 2) {
        if (/ajmer/i.test(userMsg)) location = 'Ajmer Road';
        else if (/jagatpura/i.test(userMsg)) location = 'Jagatpura';
        else if (/mansarovar/i.test(userMsg)) location = 'Mansarovar';
        else if (/malviya/i.test(userMsg)) location = 'Malviya Nagar';
        else if (/vaishali/i.test(userMsg)) location = 'Vaishali Nagar';
        else if (/jaipur/i.test(userMsg)) location = 'Jaipur';
        else location = 'Jaipur';
      }

      let bhk = prefs.bhk || (prefs.bedrooms ? String(prefs.bedrooms) : '');
      if (!bhk) {
        const match = userMsg.match(/(\d+)\s*bhk/i) || userMsg.match(/(\d+)\s*bedroom/i);
        bhk = match ? match[1] : '';
      }

      let category = prefs.propertyType || (Array.isArray(prefs.propertyTypes) && prefs.propertyTypes.length > 0 ? prefs.propertyTypes[0] : '');
      if (!category) {
        if (/villa/i.test(userMsg) && !isExcludedVilla) category = 'Villa';
        else if (/flat|apartment/i.test(userMsg) && !isExcludedApartment) category = 'Flat';
        else if (/plot|land/i.test(userMsg)) category = 'Plot';
        else if (/commercial/i.test(userMsg)) category = 'Commercial';
        else category = '';
      }

      let reqListingType = prefs.listingType || '';
      if (!reqListingType) {
        if (/investment|invest/i.test(userMsg)) reqListingType = 'investment';
        else if (/rent|kiraya/i.test(userMsg)) reqListingType = 'rent';
      }

      let budget = prefs.budgetRange || (prefs.maxPrice ? `0-${prefs.maxPrice}` : '');
      if (!budget) {
        if (/1\.5\s*crore|1\.5\s*cr/i.test(userMsg)) budget = '0-15000000';
        else if (/2\s*crore|2\s*cr/i.test(userMsg)) budget = '0-20000000';
        else if (/1\s*crore|1\s*cr/i.test(userMsg)) budget = '0-10000000';
      }

      // Facing extraction
      let reqFacing = '';
      if (/north-east|north east/i.test(userMsg)) reqFacing = 'North-East';
      else if (/east/i.test(userMsg)) reqFacing = 'East';
      else if (/west/i.test(userMsg)) reqFacing = 'West';
      else if (/north/i.test(userMsg)) reqFacing = 'North';
      else if (/south/i.test(userMsg)) reqFacing = 'South';

      // Amenities & Feature extraction
      const reqAmenities: string[] = [];
      if (/terrace garden|terrace/i.test(userMsg)) reqAmenities.push('Terrace Garden');
      if (/swimming pool|pool/i.test(userMsg)) reqAmenities.push('Swimming Pool');
      if (/clubhouse|club/i.test(userMsg)) reqAmenities.push('Clubhouse');
      if (/gym|fitness/i.test(userMsg)) reqAmenities.push('Gym');
      if (/security|24\/7/i.test(userMsg)) reqAmenities.push('24/7 Security');
      if (/power backup|backup/i.test(userMsg)) reqAmenities.push('Power Backup');

      // NearBy / Proximity Landmark extraction
      const reqNearBy: string[] = [];
      if (/airport/i.test(userMsg)) reqNearBy.push('Airport');
      if (/metro|station/i.test(userMsg)) reqNearBy.push('Metro Station');
      if (/hospital|fortis/i.test(userMsg)) reqNearBy.push('Hospital');
      if (/school|college/i.test(userMsg)) reqNearBy.push('School');
      if (/mall|shopping/i.test(userMsg)) reqNearBy.push('Shopping Mall');

      const badgeParts = [];
      if (reqListingType) badgeParts.push(reqListingType.toUpperCase());
      if (bhk) badgeParts.push(`${bhk} BHK`);
      if (category) badgeParts.push(category);
      if (location) badgeParts.push(`in ${location}`);
      if (isExcludedApartment) badgeParts.push('(No Apartments)');

      setExtractedBadge(badgeParts.join(' '));
      setActiveSearchParams({ location, bhk, category, facing: reqFacing, amenities: reqAmenities, nearBy: reqNearBy });

      // 2. Save buyer preferences to backend
      const payload = { preferredLocation: location, propertyType: category, bhk, budgetRange: budget, purpose: reqListingType || 'sale' };
      await api.request('POST', '/buyer/preferences', payload).catch(() => { });

      // 3. Fetch matching properties from database
      let matchesRes = await api.request('GET', '/properties/buyer/matches').catch(() => null);
      let matchedList = Array.isArray(matchesRes) ? matchesRes : matchesRes?.data || [];

      if (!matchedList || matchedList.length === 0) {
        matchesRes = await api.request('GET', '/properties').catch(() => null);
        matchedList = Array.isArray(matchesRes) ? matchesRes : matchesRes?.data || [];
      }

      // Filter OUT negative exclusions!
      if (isExcludedApartment) {
        matchedList = matchedList.filter((p: any) => {
          const pCat = (p.category || '').toLowerCase();
          const pTitle = (p.title || '').toLowerCase();
          return !pCat.includes('flat') && !pCat.includes('apartment') && !pTitle.includes('flat') && !pTitle.includes('apartment');
        });
      }

      if (isExcludedVilla) {
        matchedList = matchedList.filter((p: any) => {
          const pCat = (p.category || '').toLowerCase();
          const pTitle = (p.title || '').toLowerCase();
          return !pCat.includes('villa') && !pTitle.includes('villa');
        });
      }

      // Filter by Listing Type if requested (e.g. investment)
      if (reqListingType) {
        const typeMatches = matchedList.filter((p: any) => (p.listingType || '').toLowerCase() === reqListingType.toLowerCase());
        if (typeMatches.length > 0) {
          matchedList = typeMatches;
        }
      }

      // 4. Calculate AI Match score & rank properties strictly according to extracted preferences
      const maxPrice = budget ? parseFloat(budget.replace(/[^0-9.]/g, '')) * (budget.includes('Cr') || budget.includes('cr') ? 10000000 : budget.includes('Lakh') || budget.includes('lakh') || budget.includes('L') ? 100000 : 1) : 0;

      matchedList = matchedList.map((p: any) => {
        let score = 50; // base score
        const pCategory = (p.category || '').toLowerCase();
        const pTitle = (p.title || '').toLowerCase();
        const pAddress = `${p.streetAddress || ''} ${p.city || ''} ${p.locality || ''}`.toLowerCase();
        const pBhk = String(p.bedrooms || 0);
        const pPrice = parseFloat(p.price || '0');

        let catMatch = false;
        if (category && category !== 'Property') {
          const searchCat = category.toLowerCase();
          if (pCategory.includes(searchCat) || pTitle.includes(searchCat)) {
            score += 25;
            catMatch = true;
          }
        }

        let bhkMatch = false;
        if (bhk) {
          if (pBhk === String(bhk) || pTitle.includes(`${bhk} bhk`)) {
            score += 15;
            bhkMatch = true;
          }
        }

        let locMatch = false;
        if (location && location !== 'Jaipur') {
          const searchLoc = location.toLowerCase().split(',')[0].trim();
          if (pAddress.includes(searchLoc) || pTitle.includes(searchLoc)) {
            score += 10;
            locMatch = true;
          }
        }

        if (maxPrice > 0 && pPrice > 0 && pPrice <= maxPrice * 1.1) {
          score += 10;
        }

        const finalScore = Math.min(Math.max(score, 60), 99);

        // Natural language AI match rationale
        let rationale = `${finalScore}% Match: `;
        if (catMatch && bhkMatch && locMatch) {
          rationale += `Exact match for ${bhk} BHK ${category} in ${location} fitting your budget.`;
        } else if (catMatch && bhkMatch) {
          rationale += `Matches ${bhk} BHK ${category} in ${p.city || 'Jaipur'}.`;
        } else if (catMatch) {
          rationale += `Matches requested ${category} type.`;
        } else {
          rationale += `Recommended property matching your general location & price range.`;
        }

        return {
          ...p,
          matchScore: finalScore,
          explanation: rationale,
        };
      });

      // 5. Sort properties: properties matching category & BHK first, then by matchScore descending!
      matchedList.sort((a: any, b: any) => {
        const aCatMatch = category && (a.category || '').toLowerCase().includes(category.toLowerCase()) ? 1 : 0;
        const bCatMatch = category && (b.category || '').toLowerCase().includes(category.toLowerCase()) ? 1 : 0;
        if (aCatMatch !== bCatMatch) return bCatMatch - aCatMatch;
        return (b.matchScore || 0) - (a.matchScore || 0);
      });

      setAiResultsProperties(matchedList);
      setDashboardProperties(matchedList);
      setIsAiFiltered(true);

      // 6. Call /ai/chat for real conversational AI response
      let chatReply = '';
      let chatIntent = '';
      try {
        const chatRes = await api.request('POST', '/ai/chat', {
          buyerId: 'buyer-demo-123',
          message: userMsg,
          candidateProperties: matchedList.slice(0, 10),
        });
        chatReply = chatRes?.reply || chatRes?.response || chatRes?.message || '';
        chatIntent = chatRes?.intent || '';
      } catch (e) {
        // fallback
      }

      const isGeneralChat = chatIntent === 'GENERAL_CHAT' || (
        !category && !bhk && !reqFacing && reqAmenities.length === 0 && reqNearBy.length === 0 && (!location || location === 'Jaipur') && !budget && !reqListingType
      );

      if (!chatReply) {
        if (isGeneralChat) {
          chatReply = `AI Assistant: Hello! Main aapka Hobnob AI Assistant hoon. Main aapki Jaipur me property search karne me madad kar sakta hoon.`;
        } else {
          chatReply = `AI Assistant: I analyzed your request for "${userMsg}". Found ${matchedList.length} matching properties for your search criteria!`;
        }
      }

      setAiChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: chatReply,
          hasResults: !isGeneralChat && matchedList.length > 0,
          matchCount: isGeneralChat ? 0 : matchedList.length,
        }
      ]);

      if (!isGeneralChat && matchedList.length > 0) {
        setSuccess(`AI found ${matchedList.length} matching properties! Click the button below to view.`);
        setTimeout(() => setSuccess(null), 3500);
      }
    } catch (err: any) {
      // Fetch direct database properties
      const dbRes = await api.request('GET', '/properties').catch(() => []);
      const dbList = Array.isArray(dbRes) ? dbRes : dbRes?.data || [];
      setAiResultsProperties(dbList);
      setAiChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Found ${dbList.length} database properties matching your criteria!`,
          hasResults: true,
          matchCount: dbList.length,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ── Tour Booking Handlers ──
  const openTourBooking = async (property: any) => {
    setSelectedProperty(property);
    setLoading(true);
    const brokerId = property.createdById || property.createdBy?.id || 'broker-123';
    try {
      const res = await api.request('GET', `/meetings/slots?brokerId=${brokerId}`);
      setAvailableSlots(Array.isArray(res) ? res : []);
    } catch (err) {
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const submitTourBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;

    setLoading(true);
    try {
      const payload = {
        propertyId: selectedProperty.id,
        slotId: selectedSlotId || undefined,
        meetingType: selectedMeetingType,
        brokerNote: meetingBrokerNote,
      };

      await api.request('POST', '/meetings', payload);
      setSuccess('Site visit scheduled successfully!');
      setScreen('meetings');
      fetchMeetings();
    } catch (err: any) {
      setError(err.message || 'Failed to book site visit.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await api.request('GET', '/meetings/my');
      const items = Array.isArray(res) ? res : res?.items || [];
      setBookedMeetings(items);
      setScreen('meetings');
    } catch (err) {
      setBookedMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[750px] py-2">
      {/* Top Bar Controls */}
      <div className="flex items-center justify-between w-[360px] mb-3 px-2">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <SmartphoneIcon /> Mobile Simulator
        </span>
        <div className="flex gap-2">
          {screen !== 'login' && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
            >
              <RefreshCw size={11} /> Logout
            </button>
          )}
          <button
            onClick={handleSkipAuth}
            className="flex items-center gap-1 text-[11px] bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-lg transition"
          >
            <Zap size={11} /> Quick Login
          </button>
        </div>
      </div>

      {/* Smartphone Device Frame */}
      <div className="relative w-[360px] h-[720px] rounded-[48px] border-[12px] border-slate-950 bg-slate-950 shadow-2xl overflow-hidden flex flex-col ring-4 ring-indigo-500/15">

        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-slate-950 phone-notch z-50 flex justify-center items-center">
          <div className="w-12 h-1 bg-slate-800 rounded-full mb-1"></div>
        </div>

        {/* Status Bar */}
        <div className="h-9 bg-slate-950 text-slate-400 text-[11px] px-6 pt-3 flex justify-between items-center z-40 select-none shrink-0 font-medium">
          <span>9:41 AM</span>
          <div className="flex items-center gap-1.5">
            <span>5G</span>
            <div className="w-5 h-2.5 border border-slate-600 rounded-[3px] p-0.5 flex items-center">
              <div className="w-full h-full bg-slate-400 rounded-[1px]"></div>
            </div>
          </div>
        </div>

        {/* Dynamic Screen Viewport */}
        <div className="flex-1 bg-slate-900 overflow-y-auto px-4 py-3 flex flex-col justify-between relative text-slate-100">

          <div className="flex-1 flex flex-col min-h-0">
            {/* Alerts */}
            {success && (
              <div className="mb-3 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl flex items-start gap-2 text-[11px] text-emerald-400 animate-fadeIn shrink-0">
                <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className="mb-3 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl flex items-start gap-2 text-[11px] text-rose-400 animate-fadeIn shrink-0">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span className="break-all">{error}</span>
              </div>
            )}

            {/* ── SCREEN 1: SIGN IN / LOGIN ── */}
            {screen === 'login' && (
              <div className="flex-1 flex flex-col justify-center py-4">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-3 shadow-lg shadow-indigo-600/30">
                    <Building2 size={28} />
                  </div>
                  <h3 className="text-xl font-extrabold text-white">Hobnob Mobile</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Sign in to search & match luxury properties</p>
                </div>

                {/* Auth Mode Switcher */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-5">
                  <button
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${authMode === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setAuthMode('register')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${authMode === 'register' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    Register
                  </button>
                </div>

                {authMode === 'login' ? (
                  !otpSent ? (
                    <form onSubmit={onSendOtpSubmit} className="space-y-3.5">
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                        <input
                          type="tel"
                          required
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          placeholder="Phone Number"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                      >
                        {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                        <ArrowRight size={14} />
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={onVerifyOtpSubmit} className="space-y-3.5">
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={loginOtp}
                          onChange={(e) => setLoginOtp(e.target.value)}
                          placeholder="Enter OTP (e.g. 123456)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-center font-mono tracking-widest font-bold"
                        />
                      </div>

                      {mockOtpHint && (
                        <p className="text-[10px] text-amber-400 text-center font-medium bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                          {mockOtpHint}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                      >
                        {loading ? 'Verifying...' : 'Verify & Open Dashboard'}
                        <ArrowRight size={14} />
                      </button>
                    </form>
                  )
                ) : (
                  <form onSubmit={onRegisterSubmit} className="space-y-3">
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="Phone Number"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="Email Address (Optional)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                      {loading ? 'Registering...' : 'Create Account'}
                      <ArrowRight size={14} />
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ── SCREEN 2: BUYER DASHBOARD ── */}
            {screen === 'dashboard' && (
              <div className="flex-1 flex flex-col space-y-3.5 overflow-y-auto pr-0.5">
                {/* User Header */}
                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-850">
                  <div>
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Welcome back</span>
                    <h3 className="text-sm font-black text-white">System Buyer</h3>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs">
                    SB
                  </div>
                </div>

                {/* Hero AI Search Card */}
                <div
                  onClick={() => setScreen('ai-chat')}
                  className="bg-gradient-to-br from-indigo-900 via-purple-950 to-slate-950 border border-indigo-500/30 rounded-2xl p-4 shadow-xl cursor-pointer hover:border-indigo-400 transition group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-xl">
                      <Sparkles size={16} className="animate-pulse" />
                    </div>
                    <span className="text-xs font-extrabold text-indigo-200">AI Conversational Assistant</span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1">Search Properties with AI</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                    Ask AI in natural language to find matching villas, apartments & pricing in real-time.
                  </p>

                  <div className="bg-slate-950/80 border border-indigo-500/20 rounded-xl p-2.5 flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate">"3 BHK villa in Jagatpura..."</span>
                    <span className="bg-indigo-600 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] shrink-0 group-hover:scale-105 transition">
                      Chat Now →
                    </span>
                  </div>
                </div>

                {/* Dashboard Properties Feed */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        {isAiFiltered ? '✨ AI Matched Properties' : 'Featured Published Properties'}
                      </h4>
                    </div>
                    <span className="text-[10px] text-indigo-400 font-semibold">{dashboardProperties.length} Available</span>
                  </div>

                  {/* AI Active Search Banner & Filter Reset Bar */}
                  {isAiFiltered && (
                    <div className="mb-3 p-2.5 bg-indigo-950/60 border border-indigo-500/30 rounded-xl flex items-center justify-between gap-2 shadow-inner">
                      <div className="flex items-center gap-1.5 text-[10px] text-indigo-200 truncate">
                        <Sparkles size={13} className="text-indigo-400 shrink-0 animate-pulse" />
                        <span className="truncate">Filtered: <strong>{extractedBadge || 'AI Natural Query'}</strong></span>
                      </div>
                      <button
                        onClick={fetchDashboardProperties}
                        className="text-[9px] bg-slate-900 hover:bg-slate-850 text-indigo-300 px-2 py-1 rounded-lg border border-indigo-500/30 font-bold shrink-0 transition"
                      >
                        Reset to All
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {dashboardProperties.map((prop) => {
                      const isFav = wishlistItems.some((w) => w.id === prop.id || w.propertyId === prop.id);
                      const cover = prop.images?.[0]?.url || 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800';
                      const matchPct = prop.matchScore ? `${prop.matchScore}%` : isAiFiltered ? '90%' : null;

                      return (
                        <div
                          key={prop.id}
                          onClick={() => { setSelectedProperty(prop); setScreen('details'); }}
                          className="bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-2xl overflow-hidden shadow-md cursor-pointer transition flex flex-col group"
                        >
                          <div className="relative h-32 w-full bg-slate-900">
                            <img src={cover} alt={prop.title} className="w-full h-full object-cover" />
                            
                            {/* Match Score Badge */}
                            {matchPct && (
                              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[9px] font-bold bg-emerald-500/90 text-white rounded-full backdrop-blur-md shadow-md flex items-center gap-1">
                                <Sparkles size={9} />
                                {matchPct} Match
                              </span>
                            )}

                            <button
                              onClick={(e) => toggleWishlist(prop, e)}
                              className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-slate-950/70 text-white hover:bg-slate-950 transition"
                            >
                              <Heart size={14} className={isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-300'} />
                            </button>
                            <span className="absolute bottom-2 left-2 text-[10px] font-mono font-bold bg-slate-950/90 text-indigo-300 px-2 py-0.5 rounded-md border border-slate-800">
                              ₹{parseFloat(prop.price || '0').toLocaleString()}
                            </span>
                          </div>

                          <div className="p-3">
                            <h5 className="text-xs font-bold text-white truncate">{prop.title}</h5>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                              <MapPin size={11} className="text-indigo-400 shrink-0" />
                              {prop.streetAddress || prop.city}
                            </p>

                            <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 border-t border-slate-900 pt-2">
                              <span className="flex items-center gap-1"><Bed size={11} /> {prop.bedrooms || 3} Bed</span>
                              <span className="flex items-center gap-1"><Bath size={11} /> {prop.bathrooms || 2} Bath</span>
                              <span className="capitalize text-indigo-400 font-semibold">{prop.category}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── SCREEN 3: AI CHAT SCREEN ── */}
            {screen === 'ai-chat' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setScreen('dashboard')} className="p-1 text-slate-400 hover:text-white">
                      <ChevronLeft size={18} />
                    </button>
                    <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
                      <Bot size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">AI Property Assistant</h4>
                      <p className="text-[9px] text-purple-400">Natural language search</p>
                    </div>
                  </div>
                </div>

                {/* Messages stream */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-3">
                  {aiChatMessages.map((m, idx) => (
                    <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[88%] p-3 rounded-2xl text-[11px] leading-relaxed ${m.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-950 border border-slate-850 text-slate-200 rounded-bl-none'
                          }`}
                      >
                        <p>{m.text}</p>

                        {m.sender === 'ai' && m.hasResults && (
                          <button
                            onClick={() => setScreen('ai-results')}
                            className="mt-2.5 w-full text-[10px] font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/40 border border-emerald-400/30 transition transform active:scale-95 cursor-pointer"
                          >
                            <Sparkles size={12} className="text-emerald-200" />
                            <span>View {m.matchCount || aiResultsProperties.length} Matched Properties →</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Query Form */}
                <form onSubmit={handleAiSearchSubmit} className="space-y-2 shrink-0 border-t border-slate-850 pt-2.5">
                  <textarea
                    rows={2}
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="Type your search query (e.g. 3 BHK villa in Jagatpura under 1.5 Cr)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none resize-none"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>AI Processing Query...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} />
                        <span>Submit & View Matching Properties</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ── SCREEN 4: AI SEARCH RESULTS PAGE ── */}
            {screen === 'ai-results' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setScreen('ai-chat')} className="p-1 text-slate-400 hover:text-white">
                      <ChevronLeft size={18} />
                    </button>
                    <div>
                      <h4 className="text-xs font-bold text-white">AI Search Results</h4>
                      <p className="text-[9px] text-indigo-400 font-semibold">{aiResultsProperties.length} Matches Found</p>
                    </div>
                  </div>
                  <button onClick={() => setScreen('ai-chat')} className="text-[10px] text-indigo-400 hover:underline">
                    New AI Query
                  </button>
                </div>

                {extractedBadge && (
                  <div className="space-y-1.5 shrink-0 mb-1">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-[10px] text-indigo-300 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-indigo-400 shrink-0" />
                      <span className="font-semibold truncate">Criteria: {extractedBadge}</span>
                    </div>

                    {/* Matched & Unmatched Criteria Chips Bar */}
                    {activeSearchParams && (() => {
                      const topProp = aiResultsProperties[0];
                      const topText = topProp ? `${topProp.title || ''} ${topProp.description || ''} ${topProp.streetAddress || ''} ${topProp.city || ''} ${topProp.locality || ''} ${topProp.facing || ''} ${(topProp.amenities || []).join(' ')}`.toLowerCase() : '';

                      return (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {/* 1. BHK */}
                          {activeSearchParams.bhk && (
                            topProp && String(topProp.bedrooms) === String(activeSearchParams.bhk) ? (
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 shadow-sm">
                                <Check size={11} className="text-emerald-400 stroke-[3]" />
                                <span>{activeSearchParams.bhk} BHK</span>
                              </span>
                            ) : (
                              <span className="text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 shadow-sm">
                                <X size={11} className="text-rose-400 stroke-[3]" />
                                <span>{activeSearchParams.bhk} BHK</span>
                              </span>
                            )
                          )}

                          {/* 2. Category */}
                          {activeSearchParams.category && activeSearchParams.category !== 'Property' && (
                            topProp && (topProp.category || '').toLowerCase().includes(activeSearchParams.category.toLowerCase()) ? (
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 shadow-sm">
                                <Check size={11} className="text-emerald-400 stroke-[3]" />
                                <span>{activeSearchParams.category}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 shadow-sm">
                                <X size={11} className="text-rose-400 stroke-[3]" />
                                <span>{activeSearchParams.category}</span>
                              </span>
                            )
                          )}

                          {/* 3. Location */}
                          {activeSearchParams.location && activeSearchParams.location !== 'Jaipur' && (
                            topText.includes(activeSearchParams.location.toLowerCase().split(',')[0].trim()) ? (
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 shadow-sm">
                                <Check size={11} className="text-emerald-400 stroke-[3]" />
                                <span>{activeSearchParams.location}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 shadow-sm">
                                <X size={11} className="text-rose-400 stroke-[3]" />
                                <span>{activeSearchParams.location}</span>
                              </span>
                            )
                          )}

                          {/* 4. Facing */}
                          {activeSearchParams.facing && (
                            topText.includes(activeSearchParams.facing.toLowerCase()) ? (
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 shadow-sm">
                                <Check size={11} className="text-emerald-400 stroke-[3]" />
                                <span>{activeSearchParams.facing} Facing</span>
                              </span>
                            ) : (
                              <span className="text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 shadow-sm">
                                <X size={11} className="text-rose-400 stroke-[3]" />
                                <span>{activeSearchParams.facing} Facing</span>
                              </span>
                            )
                          )}

                          {/* 5. Amenities */}
                          {activeSearchParams.amenities && activeSearchParams.amenities.map((amenity, aIdx) => {
                            const isMatch = topText.includes(amenity.toLowerCase());
                            return isMatch ? (
                              <span key={aIdx} className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 shadow-sm">
                                <Check size={11} className="text-emerald-400 stroke-[3]" />
                                <span>{amenity}</span>
                              </span>
                            ) : (
                              <span key={aIdx} className="text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 shadow-sm">
                                <X size={11} className="text-rose-400 stroke-[3]" />
                                <span>{amenity}</span>
                              </span>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Results List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                  {aiResultsProperties.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      <Compass size={24} className="mx-auto mb-2 text-slate-600" />
                      <span>No matching properties returned for this AI search. Try refining query.</span>
                    </div>
                  ) : (
                    aiResultsProperties.map((prop, idx) => {
                      const isFav = wishlistItems.some((w) => w.id === prop.id || w.propertyId === prop.id);
                      const cover = prop.images?.[0]?.url || 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800';

                      return (
                        <div
                          key={prop.id || idx}
                          onClick={() => { setSelectedProperty(prop); setScreen('details'); }}
                          className="bg-slate-950 border border-slate-850 hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-md cursor-pointer transition flex flex-col"
                        >
                          <div className="relative h-32 w-full bg-slate-900">
                            <img src={cover} alt={prop.title} className="w-full h-full object-cover" />
                            <span className="absolute top-2.5 left-2.5 text-[9px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-md shadow">
                              AI Match: {prop.matchScore ? `${prop.matchScore}%` : `${95 - idx * 3}%`}
                            </span>
                            <button
                              onClick={(e) => toggleWishlist(prop, e)}
                              className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-slate-950/70 text-white hover:bg-slate-950 transition"
                            >
                              <Heart size={14} className={isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-300'} />
                            </button>
                            <span className="absolute bottom-2 right-2 text-[10px] font-mono font-bold bg-slate-950/90 text-indigo-300 px-2 py-0.5 rounded-md border border-slate-800">
                              ₹{parseFloat(prop.price || '0').toLocaleString()}
                            </span>
                          </div>

                          <div className="p-3">
                            <h5 className="text-xs font-bold text-white truncate">{prop.title}</h5>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                              <MapPin size={11} className="text-indigo-400 shrink-0" />
                              {prop.streetAddress || prop.locality || prop.city}
                            </p>

                            {prop.explanation && (
                              <p className="text-[9px] text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-2 py-1 rounded-md mt-1.5 line-clamp-2">
                                ✨ {prop.explanation}
                              </p>
                            )}

                            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-900 text-[10px]">
                              <span className="text-slate-400">{prop.bedrooms || 3} BHK · {prop.category || 'Property'}</span>
                              <span className="text-indigo-400 font-bold hover:underline">View Details →</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ── SCREEN 5: PROPERTY DETAILS PAGE ── */}
            {screen === 'details' && selectedProperty && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-y-auto pr-0.5">
                {/* Top Navbar */}
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <button onClick={() => setScreen('ai-results')} className="p-1 text-slate-400 hover:text-white flex items-center gap-1 text-xs">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    onClick={(e) => toggleWishlist(selectedProperty, e)}
                    className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  >
                    <Heart size={15} className={wishlistItems.some((w) => w.id === selectedProperty.id || w.propertyId === selectedProperty.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-400'} />
                  </button>
                </div>

                {/* Image Cover */}
                <div className="h-44 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-850 relative">
                  <img
                    src={selectedProperty.images?.[0]?.url || 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800'}
                    alt={selectedProperty.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 text-xs font-bold bg-indigo-600 text-white px-2.5 py-1 rounded-lg">
                    ₹{parseFloat(selectedProperty.price || '0').toLocaleString()}
                  </span>
                </div>

                {/* Details info */}
                <div>
                  <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded font-bold uppercase">
                    {selectedProperty.propertyCode || 'PROPERTY-LISTING'}
                  </span>
                  <h3 className="text-sm font-extrabold text-white mt-1">{selectedProperty.title}</h3>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin size={12} className="text-indigo-400" />
                    {selectedProperty.streetAddress}, {selectedProperty.city}
                  </p>
                </div>

                {/* Specs grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl">
                    <Bed size={13} className="mx-auto text-indigo-400 mb-1" />
                    <span className="font-bold text-white block">{selectedProperty.bedrooms || 3} BHK</span>
                    <span className="text-slate-500 text-[9px]">Bedrooms</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
                    <Bath size={13} className="mx-auto text-indigo-400 mb-1" />
                    <span className="font-bold text-white block">{selectedProperty.bathrooms || 2} Bath</span>
                    <span className="text-slate-500 text-[9px]">Bathrooms</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
                    <Building2 size={13} className="mx-auto text-indigo-400 mb-1" />
                    <span className="font-bold text-white block">{selectedProperty.area || '1800'}</span>
                    <span className="text-slate-500 text-[9px]">Area sq ft</span>
                  </div>
                </div>

                {/* Extra Specs: Furnishing, Facing, Parking */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="bg-slate-950/70 border border-slate-850 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-500 block uppercase font-semibold">Furnishing</span>
                    <span className="font-bold text-emerald-400 block capitalize mt-0.5">{selectedProperty.furnishing || 'semi-furnished'}</span>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-850 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-500 block uppercase font-semibold">Facing</span>
                    <span className="font-bold text-amber-400 block mt-0.5">{selectedProperty.facing || 'East'}</span>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-850 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-500 block uppercase font-semibold">Parking</span>
                    <span className="font-bold text-indigo-300 block mt-0.5">{selectedProperty.parking ?? 2} Slots</span>
                  </div>
                </div>

                {/* Amenities */}
                <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl space-y-1.5">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">✨ Key Amenities</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {(selectedProperty.amenities && Array.isArray(selectedProperty.amenities) && selectedProperty.amenities.length > 0
                      ? selectedProperty.amenities
                      : ['Swimming Pool', 'Clubhouse', '24/7 Security', 'Fitness Gym', '100% Power Backup', 'Covered Parking', 'High-Speed Elevator']
                    ).map((amenity: string, aIdx: number) => (
                      <span key={aIdx} className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-lg font-medium">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Nearby Locations & Landmarks */}
                <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">📍 Nearby Places & Distance</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {(selectedProperty.nearBy && Array.isArray(selectedProperty.nearBy) && selectedProperty.nearBy.length > 0
                      ? selectedProperty.nearBy
                      : ['Airport (4 km)', 'Metro Station (1.5 km)', 'Fortis Hospital (1 km)', 'International School (800m)', 'World Trade Park (3 km)']
                    ).map((place: string, pIdx: number) => (
                      <span key={pIdx} className="text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-medium">
                        {place}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {selectedProperty.description || 'Spacious modern luxury property featuring high-end smart home fittings and prime city connectivity.'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => openTourBooking(selectedProperty)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
                  >
                    <Calendar size={14} />
                    <span>Book Site Visit / Tour</span>
                  </button>
                </div>

                {/* Tour Scheduling Form if active */}
                {selectedProperty && availableSlots.length > 0 && (
                  <form onSubmit={submitTourBooking} className="bg-slate-950 border border-indigo-500/30 p-3 rounded-2xl space-y-2 mt-2">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Available Tour Slots</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {availableSlots.slice(0, 4).map((slot) => (
                        <button
                          type="button"
                          key={slot.id}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`p-2 rounded-xl border text-[10px] font-medium text-center transition ${selectedSlotId === slot.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
                        >
                          {new Date(slot.slotTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(slot.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !selectedSlotId}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition mt-2 disabled:opacity-50"
                    >
                      Confirm Site Visit
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ── SCREEN 6: WISHLIST PAGE ── */}
            {screen === 'wishlist' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Heart size={14} className="fill-rose-500 text-rose-500" />
                    My Saved Wishlist
                  </h4>
                  <span className="text-[10px] text-indigo-400 font-semibold">{wishlistItems.length} Saved</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                  {wishlistItems.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center">
                      <Heart size={28} className="text-slate-700 mb-2" />
                      <span>Your wishlist is empty. Tap heart icon on properties to save!</span>
                    </div>
                  ) : (
                    wishlistItems.map((item, i) => {
                      const prop = item.property ? item.property : item;
                      const cover = prop.images?.[0]?.url || 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800';

                      return (
                        <div
                          key={prop.id || i}
                          onClick={() => { setSelectedProperty(prop); setScreen('details'); }}
                          className="bg-slate-950 border border-slate-850 p-3 rounded-2xl flex gap-3 items-center cursor-pointer hover:border-slate-700 transition"
                        >
                          <div className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden shrink-0">
                            <img
                              src={cover}
                              alt={prop.title || 'Saved Property'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-white truncate">{prop.title || 'Saved Property'}</h5>
                            <p className="text-[10px] font-mono text-indigo-400 font-bold">₹{parseFloat(prop.price || '0').toLocaleString()}</p>
                            <p className="text-[9px] text-slate-500 truncate">{prop.streetAddress || prop.city || 'Jaipur'}</p>
                          </div>
                          <button
                            onClick={(e) => toggleWishlist(prop, e)}
                            className="p-1.5 text-rose-400 hover:text-rose-300"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ── SCREEN 7: MEETINGS / TOURS PAGE ── */}
            {screen === 'meetings' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Calendar size={14} className="text-indigo-400" />
                    My Scheduled Tours
                  </h4>
                  <button onClick={fetchMeetings} className="text-indigo-400 p-1">
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                  {bookedMeetings.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center">
                      <Calendar size={24} className="text-slate-700 mb-2" />
                      <span>No site visits booked yet. Browse properties to schedule!</span>
                    </div>
                  ) : (
                    bookedMeetings.map((m) => (
                      <div key={m.id} className="bg-slate-950 border border-slate-850 p-3 rounded-2xl space-y-2">
                        <div className="flex justify-between items-start">
                          <h5 className="text-xs font-bold text-white truncate">{m.property?.title || 'Site Tour'}</h5>
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">
                            {m.status || 'CONFIRMED'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(m.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Bottom Smartphone Navigation Bar */}
          {screen !== 'login' && (
            <div className="h-12 border-t border-slate-800 bg-slate-950 -mx-4 -mb-3 flex items-center justify-around z-40 shrink-0 select-none">
              <button
                onClick={() => setScreen('dashboard')}
                className={`flex flex-col items-center gap-0.5 text-[9px] transition ${screen === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
              >
                <Home size={14} />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setScreen('ai-chat')}
                className={`flex flex-col items-center gap-0.5 text-[9px] transition ${screen === 'ai-chat' ? 'text-purple-400 font-bold' : 'text-slate-500'}`}
              >
                <Bot size={14} className="text-purple-400" />
                <span>AI Chat</span>
              </button>

              <button
                onClick={() => setScreen('ai-results')}
                className={`flex flex-col items-center gap-0.5 text-[9px] transition ${screen === 'ai-results' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
              >
                <Compass size={14} />
                <span>Results</span>
              </button>

              <button
                onClick={() => { fetchWishlist(); setScreen('wishlist'); }}
                className={`flex flex-col items-center gap-0.5 text-[9px] transition ${screen === 'wishlist' ? 'text-rose-400 font-bold' : 'text-slate-500'}`}
              >
                <Heart size={14} className={wishlistItems.length > 0 ? 'fill-rose-500 text-rose-500' : ''} />
                <span>Wishlist</span>
              </button>

              <button
                onClick={fetchMeetings}
                className={`flex flex-col items-center gap-0.5 text-[9px] transition ${screen === 'meetings' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
              >
                <Calendar size={14} />
                <span>Tours</span>
              </button>
            </div>
          )}

        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="h-5 bg-slate-950 flex justify-center items-center shrink-0">
          <div className="w-28 h-1 bg-slate-800 rounded-full mb-1"></div>
        </div>

      </div>
    </div>
  );
}

function SmartphoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}
