/** Blank vendor row for `vendor-profiles.json` (not a Next route — safe to import anywhere). */
export function createDefaultProfileForVendor(userId: string, email: string) {
  return {
    id: `vendor_${userId}`,
    userId,
    businessName: '',
    description: '',
    services: [] as any[],
    serviceCategories: [] as any[],
    locationsServed: [] as any[],
    portfolio: [] as any[],
    testimonials: [] as any[],
    availability: [] as any[],
    contactInfo: {
      email: email || '',
      phone: '',
      website: '',
      socialMedia: {} as Record<string, string>,
    },
    businessInfo: {
      yearsInBusiness: 0,
      teamSize: 0,
      languages: [] as string[],
      certifications: [] as string[],
      insurance: false,
      licenseNumber: '',
    },
    settings: {
      autoAcceptLeads: false,
      leadNotificationEmail: true,
      leadNotificationSMS: false,
      profileVisibility: 'public' as const,
      showPricing: true,
      allowDirectBooking: false,
    },
    stats: {
      profileViews: 0,
      portfolioViews: 0,
      inquiryCount: 0,
      responseRate: 0,
      averageResponseTime: 0,
    },
    isApproved: false,
    approvalStatus: 'pending' as const,
    lastUpdated: new Date().toISOString(),
  };
}
