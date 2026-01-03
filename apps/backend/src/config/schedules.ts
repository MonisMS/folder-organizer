export const schedules = {
//everyday at 2 am 
autoOrganizeDownloads :{
    pattern: '0 2 * * *',
    enabled: false, // Disabled - users must manually trigger organization
    timezone: process.env.TZ || 'UTC',
    config:{
        sourcePath: process.env.DEFAULT_SOURCE_PATH || '',
      targetPath: process.env.DEFAULT_TARGET_PATH || '',
    },
},

//weekly duplicate scan 
weeklyDuplicateScan:{
    pattern: '0 3 * * 0',
    enabled: false, // Disabled - users must manually trigger
    timezone: process.env.TZ || 'UTC',
    config:{
        sourcePath: process.env.DEFAULT_SOURCE_PATH || '',
    },
},

//dalily cleanup of old jobs at midnight 

dailyJobCleanup:{
    pattern: '0 0 * * *',
    enabled: false, // Disabled - users must manually trigger
    timezone: process.env.TZ || 'UTC',
    config:{
        daysToKeep: 7 // Keep jobs for 7 days
    },

},

// Test schedule - every minute (for development)
  testSchedule: {
    pattern: '* * * * *',
    enabled: false, // Disabled after testing
    timezone: process.env.TZ || 'UTC',
    config: {
      sourcePath: process.env.DEFAULT_SOURCE_PATH || '',
      targetPath: process.env.DEFAULT_TARGET_PATH || '',
    },
  },
} as const;

export type scheduleName = keyof typeof schedules;
