export interface ApiCallLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  requestBody?: any;
  responseStatus?: number;
  responseStatusText?: string;
  responseBody?: any;
  durationMs?: number;
  error?: string;
  isMocked: boolean;
}

type LogCallback = (log: ApiCallLog) => void;
type LogsChangeCallback = (logs: ApiCallLog[]) => void;

class ApiTracker {
  private logs: ApiCallLog[] = [];
  private logCallbacks: Set<LogCallback> = new Set();
  private logsChangeCallbacks: Set<LogsChangeCallback> = new Set();
  private apiBaseUrl: string = 'http://localhost:3001';
  private useMockFallback: boolean = false;
  private token: string | null = null;
  private mockMeetings: any[] = [];
  private mockWishlist: any[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.apiBaseUrl = localStorage.getItem('api_base_url') || 'http://localhost:3001';
      this.useMockFallback = localStorage.getItem('use_mock_fallback') === 'true';
      this.token = localStorage.getItem('auth_token') || null;
      try {
        this.mockMeetings = JSON.parse(localStorage.getItem('mock_meetings') || '[]');
      } catch {
        this.mockMeetings = [];
      }
    }
  }

  private saveMockMeetings() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_meetings', JSON.stringify(this.mockMeetings));
    }
  }

  public getBaseUrl() {
    return this.apiBaseUrl;
  }

  public setBaseUrl(url: string) {
    this.apiBaseUrl = url;
    if (typeof window !== 'undefined') {
      localStorage.setItem('api_base_url', url);
    }
  }

  public getMockFallback() {
    return this.useMockFallback;
  }

  public setMockFallback(val: boolean) {
    this.useMockFallback = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('use_mock_fallback', String(val));
    }
  }

  public getToken() {
    return this.token;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  public getLogs(): ApiCallLog[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.notifyLogsChanged();
  }

  public onLog(cb: LogCallback) {
    this.logCallbacks.add(cb);
    return () => this.logCallbacks.delete(cb);
  }

  public onLogsChange(cb: LogsChangeCallback) {
    this.logsChangeCallbacks.add(cb);
    cb([...this.logs]);
    return () => this.logsChangeCallbacks.delete(cb);
  }

  private addLog(log: ApiCallLog) {
    if (this.logs.some(l => l.id === log.id)) {
      log = { ...log, id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
    }
    this.logs = [log, ...this.logs].slice(0, 100); // Keep last 100 logs
    this.logCallbacks.forEach(cb => cb(log));
    this.notifyLogsChanged();
  }

  private notifyLogsChanged() {
    this.logsChangeCallbacks.forEach(cb => cb([...this.logs]));
  }

  public async request(
    method: string,
    path: string,
    body?: any,
    customHeaders?: Record<string, string>
  ): Promise<any> {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = new Date().toISOString();
    const url = `${this.apiBaseUrl}${path.startsWith('/') ? path : '/' + path}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const start = performance.now();

    // Prepare log structure
    const log: ApiCallLog = {
      id,
      timestamp,
      method,
      url,
      headers,
      requestBody: body,
      isMocked: false,
    };

    if (this.useMockFallback) {
      return this.handleMockRequest(method, path, body, log, start);
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const end = performance.now();
      log.durationMs = Math.round(end - start);
      log.responseStatus = response.status;
      log.responseStatusText = response.statusText;

      let responseData: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = { text: await response.text() };
      }

      log.responseBody = responseData;
      this.addLog(log);

      if (!response.ok) {
        throw new Error(responseData?.message || `Request failed with status ${response.status}`);
      }

      // If we verify login OTP, we receive a token, let's store it
      if (path === '/auth/login/verify-otp' && responseData?.accessToken) {
        this.setToken(responseData.accessToken);
      }

      return responseData;
    } catch (err: any) {
      const end = performance.now();
      log.durationMs = Math.round(end - start);
      log.error = err.message || 'Network Error';
      
      // If network fails (e.g. backend down or CORS error), try mock fallback
      console.warn(`API call failed: ${err.message}. Trying mock fallback if configured.`);
      
      if (!this.useMockFallback) {
        // Log the actual network failure
        this.addLog(log);
        throw err;
      } else {
        return this.handleMockRequest(method, path, body, log, start, err.message);
      }
    }
  }

  private handleMockRequest(
    method: string,
    path: string,
    body: any,
    log: ApiCallLog,
    start: number,
    originalError?: string
  ): any {
    log.isMocked = true;
    const end = performance.now();
    log.durationMs = Math.round(end - start);
    log.responseStatus = 200;
    log.responseStatusText = 'OK (Mocked)';

    let responseData: any = {};

    if (path.includes('/auth/register')) {
      responseData = {
        message: 'User registered successfully (Mocked)',
        userId: 'mock-user-123',
      };
    } else if (path.includes('/auth/login/send-otp')) {
      responseData = {
        message: 'OTP sent successfully to ' + (body?.phone || 'your phone') + ' (Mocked: Use OTP 123456)',
        otpCode: '123456', // Mock helper
      };
    } else if (path.includes('/auth/login/verify-otp')) {
      if (body?.otp === '123456') {
        const mockToken = 'mock-jwt-token-xyz-123';
        responseData = {
          accessToken: mockToken,
        };
        this.setToken(mockToken);
      } else {
        log.responseStatus = 400;
        log.responseStatusText = 'Bad Request (Mocked)';
        responseData = {
          message: 'Invalid OTP code. Use 123456 for mock testing.',
        };
      }
    } else if (path.includes('/buyer/preferences')) {
      if (method === 'GET') {
        responseData = {
          budgetRange: '15000000.00-20000000.00',
          purpose: 'sale',
          bhk: '4',
          preferredLocation: 'Jagatpura',
          propertyType: 'residential',
        };
      } else {
        // POST or PATCH
        responseData = {
          id: 'pref-mock-abc',
          userId: 'mock-user-123',
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    } else if (path.includes('/properties')) {
      responseData = [
        {
          id: 'prop-db-1',
          propertyCode: 'PROP-VILLA01',
          slug: 'luxury-1-bhk-villa',
          title: 'Luxury 1 BHK Villa',
          description: 'Sample villa property with modern amenities.',
          price: '15000000.00',
          category: 'Villa',
          listingType: 'sale',
          status: 'published',
          ownerRole: 'admin',
          bedrooms: 2,
          bathrooms: 2,
          area: '3200.00',
          streetAddress: 'Plot 40, Jaipur',
          city: 'Jaipur',
          state: 'Rajasthan',
          country: 'India',
          zipCode: '302017',
          parking: 2,
          furnishing: 'furnished',
          facing: 'North-East',
          amenities: ['Swimming Pool', 'Clubhouse', '24/7 Security', 'Fitness Gym', '100% Power Backup', 'Covered Parking'],
          nearBy: ['Jaipur International Airport (4 km)', 'Metro Station (1.5 km)', 'Fortis Hospital (1 km)', 'International School (800m)'],
          images: [{ url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', isPrimary: true }]
        },
        {
          id: 'prop-db-2',
          propertyCode: 'PROP-APT02',
          slug: 'premium-2-bhk-apartment',
          title: 'Premium 2 BHK Apartment',
          description: 'Sample apartment property with modern amenities.',
          price: '8010000.00',
          category: 'Apartment',
          listingType: 'sale',
          status: 'published',
          ownerRole: 'broker',
          bedrooms: 3,
          bathrooms: 3,
          area: '1410.00',
          streetAddress: 'Plot 41, Jaipur',
          city: 'Jaipur',
          state: 'Rajasthan',
          country: 'India',
          zipCode: '302017',
          parking: 2,
          furnishing: 'semi-furnished',
          facing: 'West',
          images: [{ url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', isPrimary: true }]
        },
        {
          id: 'prop-db-3',
          propertyCode: 'PROP-FLAT03',
          slug: 'premium-3-bhk-flat',
          title: 'Premium 3 BHK Flat',
          description: 'Sample flat property with modern amenities.',
          price: '5520000.00',
          category: 'Flat',
          listingType: 'sale',
          status: 'published',
          ownerRole: 'builder',
          bedrooms: 4,
          bathrooms: 2,
          area: '1120.00',
          streetAddress: 'Plot 42, Jaipur',
          city: 'Jaipur',
          state: 'Rajasthan',
          country: 'India',
          zipCode: '302017',
          parking: 2,
          furnishing: 'furnished',
          facing: 'North',
          images: [{ url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', isPrimary: true }]
        },
        {
          id: 'prop-db-4',
          propertyCode: 'PROP-COWORK04',
          slug: 'premium-4-coworkspace',
          title: 'Premium 4 Coworkspace',
          description: 'Sample coworkspace property with modern amenities.',
          price: '105000.00',
          category: 'Coworkspace',
          listingType: 'rent',
          status: 'published',
          ownerRole: 'admin',
          bedrooms: 0,
          bathrooms: 4,
          area: '4030.00',
          streetAddress: 'Plot 43, Jaipur',
          city: 'Jaipur',
          state: 'Rajasthan',
          country: 'India',
          zipCode: '302017',
          parking: 20,
          furnishing: 'semi-furnished',
          facing: 'South',
          images: [{ url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', isPrimary: true }]
        }
      ];
    } else if (path.includes('/wishlist')) {
      if (method === 'POST') {
        const propId = body?.propertyId;
        if (!this.mockWishlist.some(item => (item.id === propId || item.propertyId === propId || item.property?.id === propId))) {
          this.mockWishlist.push(body?.property || { id: propId, propertyId: propId });
        }
        responseData = { message: 'Added to wishlist' };
      } else if (method === 'DELETE') {
        const propId = path.split('/wishlist/')[1];
        this.mockWishlist = this.mockWishlist.filter(item => item.id !== propId && item.propertyId !== propId && item.property?.id !== propId);
        responseData = { message: 'Removed from wishlist' };
      } else {
        // GET /wishlist
        responseData = {
          items: this.mockWishlist,
          total: this.mockWishlist.length,
          page: 1,
          limit: 10,
        };
      }
    } else if (path.includes('/meetings/slots')) {
      const brokerId = path.split('brokerId=')[1]?.split('&')[0] || body?.brokerId || '1fbcda6d-c094-4cff-8579-5bd030af34d1';
      const slots = [];
      const hours = [10, 14, 16];
      for (let i = 1; i <= 3; i++) {
        for (const h of hours) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          date.setHours(h, 0, 0, 0);
          
          const slotId = `slot-${brokerId}-${i}-${h}`;
          const isBooked = this.mockMeetings.some(m => m.slotId === slotId && m.status !== 'CANCELLED');
          
          slots.push({
            id: slotId,
            brokerId,
            slotTime: date.toISOString(),
            isBooked,
          });
        }
      }
      responseData = slots.filter(s => !s.isBooked);
    } else if (path.endsWith('/meetings') && method === 'POST') {
      const propertyId = body?.propertyId;
      const slotId = body?.slotId;
      const meetingType = body?.meetingType || 'SITE_VISIT';
      const brokerNote = body?.brokerNote || '';
      
      const properties = [
        {
          id: 'a2f69836-2513-4664-8b67-da3dc69891c9',
          title: 'Modern 4 BHK Villa in Jagatpura',
          streetAddress: 'Royal Enclave, Jagatpura',
          city: 'Jaipur',
          createdBy: { id: '1fbcda6d-c094-4cff-8579-5bd030af34d1', fullName: 'System Admin', phone: '9999999999', email: 'admin@hobnob.com' },
          images: [{ url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=800' }]
        },
        {
          id: 'mock-prop-2',
          title: 'Luxury 2 BHK Apartment in Malviya Nagar',
          streetAddress: 'Apex Circle, Malviya Nagar',
          city: 'Jaipur',
          createdBy: { id: 'broker-123', fullName: 'Jaipur Properties', phone: '9888888888', email: 'sales@jaipurprop.com' },
          images: [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800' }]
        }
      ];
      
      const prop = properties.find(p => p.id === propertyId) || properties[0];
      
      let scheduledAt = new Date();
      if (slotId && slotId.startsWith('slot-')) {
        const parts = slotId.split('-');
        const dayOffset = parseInt(parts[2]) || 1;
        const hour = parseInt(parts[3]) || 10;
        scheduledAt.setDate(scheduledAt.getDate() + dayOffset);
        scheduledAt.setHours(hour, 0, 0, 0);
      } else {
        scheduledAt.setDate(scheduledAt.getDate() + 1);
      }
      
      const newMeeting = {
        id: `meeting-${Math.random().toString(36).substring(2, 11)}`,
        buyerId: 'mock-user-123',
        buyerName: 'System Tester',
        brokerId: prop.createdBy.id,
        broker: prop.createdBy,
        propertyId,
        property: {
          id: prop.id,
          title: prop.title,
          streetAddress: prop.streetAddress,
          city: prop.city,
          images: prop.images,
        },
        slotId,
        scheduledAt: scheduledAt.toISOString(),
        meetingType,
        brokerNote,
        status: 'PENDING',
        feedbacks: [],
        createdAt: new Date().toISOString(),
      };
      
      this.mockMeetings.push(newMeeting);
      this.saveMockMeetings();
      responseData = newMeeting;
    } else if (path.includes('/meetings/my')) {
      responseData = {
        items: this.mockMeetings.filter(m => m.buyerId === 'mock-user-123'),
        total: this.mockMeetings.filter(m => m.buyerId === 'mock-user-123').length,
        page: 1,
        limit: 10,
      };
    } else if (path.includes('/cancel') && method === 'PATCH') {
      const meetingId = path.split('/meetings/')[1]?.split('/cancel')[0];
      const meeting = this.mockMeetings.find(m => m.id === meetingId);
      if (meeting) {
        meeting.status = 'CANCELLED';
        this.saveMockMeetings();
        responseData = meeting;
      } else {
        log.responseStatus = 404;
        responseData = { message: 'Meeting not found' };
      }
    } else if (path.includes('/feedback') && method === 'POST') {
      const meetingId = path.split('/meetings/')[1]?.split('/feedback')[0];
      const meeting = this.mockMeetings.find(m => m.id === meetingId);
      if (meeting) {
        const feedback = {
          id: `fb-${Math.random().toString(36).substring(2, 11)}`,
          meetingId,
          userId: 'mock-user-123',
          userRole: 'buyer',
          rating: body?.rating || 5,
          comment: body?.comment || '',
          createdAt: new Date().toISOString(),
        };
        if (!meeting.feedbacks) meeting.feedbacks = [];
        meeting.feedbacks.push(feedback);
        this.saveMockMeetings();
        responseData = feedback;
      } else {
        log.responseStatus = 404;
        responseData = { message: 'Meeting not found' };
      }
    } else {
      responseData = { message: 'Mock route not implemented' };
    }

    log.responseBody = responseData;
    if (originalError) {
      log.error = `Connection failed (${originalError}). Switched to Mock data automatically.`;
    }
    this.addLog(log);

    if (log.responseStatus !== 200) {
      throw new Error(responseData?.message || 'Mock request failed');
    }

    return responseData;
  }
}

export const api = new ApiTracker();
