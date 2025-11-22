export const schedules = {
//everyday at 2 am 
autoOrganizeDownloads :{
    pattern: '0 2 * * *',
    enabled: false, // Disabled - update path first
    timezone: 'Asia/Kolkata',
    config:{
        sourcePath: 'C:\\Users\\Monis\\Downloads', // Update to your actual path
      targetPath: 'C:\\OrganizedFiles',
    },
},

//weekly duplicate scan 
weeklyDuplicateScan:{
    pattern: '0 3 * * 0',
    enabled: true,
    timezone: 'Asia/Kolkata',
    config:{
        sourcePath: 'C:\\OrganizedFiles',
    },
},

//dalily cleanup of old jobs at midnight 

dailyJobCleanup:{
    pattern: '0 0 * * *',
    enabled: true,
    timezone: 'Asia/Kolkata',
    config:{
        daysToKeep: 7 // Keep jobs for 7 days
    },

},

// Test schedule - every minute (for development)
  testSchedule: {
    pattern: '* * * * *',
    enabled: false, // Disabled after testing
    timezone: 'Asia/Kolkata',
    config: {
      sourcePath: 'C:\\testfolder',
      targetPath: 'C:\\OrganizedFiles',
    },
  },
} as const;

export type scheduleName = keyof typeof schedules;
