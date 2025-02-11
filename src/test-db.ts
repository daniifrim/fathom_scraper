import { testDatabaseConnection, getAllMeetings } from './database';

async function main() {
  try {
    console.log('=== Testing Supabase Setup ===\n');
    
    // Test database connection
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.error('\nDatabase connection test failed. Please check your Supabase credentials and permissions.');
      process.exit(1);
    }

    // Test getting all meetings
    console.log('\nTesting meetings table access...');
    const meetings = await getAllMeetings();
    console.log(`Successfully accessed meetings table. Found ${meetings.length} existing meetings.`);

    console.log('\n=== All tests passed successfully ===');
    process.exit(0);
  } catch (error) {
    console.error('\nTest failed with error:', error);
    process.exit(1);
  }
}

main(); 