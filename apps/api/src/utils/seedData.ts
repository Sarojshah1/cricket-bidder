import { User } from '../models/User';
import { Team } from '../models/Team';
import { Player } from '../models/Player';
import { AuctionPlayer } from '../models/AuctionPlayer';
import { AuctionRoom } from '../models/AuctionRoom';
import bcrypt from 'bcryptjs';

export const seedData = async () => {
  try {
    console.log('🌱 Seeding database with sample data...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.findOneAndUpdate(
      { email: 'admin@cricketbidder.com' },
      {
        username: 'admin',
        email: 'admin@cricketbidder.com',
        password: adminPassword,
        role: 'admin',
        balance: 1000000,
        isActive: true
      },
      { upsert: true, new: true }
    );

    // Create team owners
    const teamOwners = [];
    const teamOwnerData = [
      { username: 'mumbai_owner', email: 'mumbai@example.com', teamName: 'Mumbai Indians' },
      { username: 'chennai_owner', email: 'chennai@example.com', teamName: 'Chennai Super Kings' },
      { username: 'bangalore_owner', email: 'bangalore@example.com', teamName: 'Royal Challengers Bangalore' },
      { username: 'delhi_owner', email: 'delhi@example.com', teamName: 'Delhi Capitals' }
    ];

    for (const ownerData of teamOwnerData) {
      const password = await bcrypt.hash('password123', 10);
      const owner = await User.findOneAndUpdate(
        { email: ownerData.email },
        {
          username: ownerData.username,
          email: ownerData.email,
          password,
          role: 'team_owner',
          balance: 1000000,
          isActive: true
        },
        { upsert: true, new: true }
      );
      teamOwners.push(owner);
    }

    // Create teams
    const teams = [];
    for (let i = 0; i < teamOwners.length; i++) {
      const team = await Team.findOneAndUpdate(
        { name: teamOwnerData[i].teamName },
        {
          name: teamOwnerData[i].teamName,
          owner: teamOwners[i]._id,
          budget: 10000000,
          remainingBudget: 10000000,
          players: [],
          maxPlayers: 25,
          isActive: true
        },
        { upsert: true, new: true }
      );
      teams.push(team);

      // Update user with team ID
      await User.findByIdAndUpdate(teamOwners[i]._id, { teamId: team._id });
    }

    // Create sample players
    const players = [];
    const playerData = [
      {
        name: 'Virat Kohli',
        age: 34,
        nationality: 'Indian',
        role: 'batsman',
        battingStyle: 'right-handed',
        basePrice: 2000000,
        stats: { matches: 250, runs: 12000, average: 48.5 }
      },
      {
        name: 'Rohit Sharma',
        age: 36,
        nationality: 'Indian',
        role: 'batsman',
        battingStyle: 'right-handed',
        basePrice: 1800000,
        stats: { matches: 230, runs: 11000, average: 45.2 }
      },
      {
        name: 'Jasprit Bumrah',
        age: 29,
        nationality: 'Indian',
        role: 'bowler',
        bowlingStyle: 'fast',
        basePrice: 1500000,
        stats: { matches: 120, wickets: 280, economy: 7.2 }
      },
      {
        name: 'Ravindra Jadeja',
        age: 34,
        nationality: 'Indian',
        role: 'all-rounder',
        battingStyle: 'left-handed',
        bowlingStyle: 'spin',
        basePrice: 1200000,
        stats: { matches: 200, runs: 5000, wickets: 250, catches: 150 }
      },
      {
        name: 'MS Dhoni',
        age: 42,
        nationality: 'Indian',
        role: 'wicket-keeper',
        battingStyle: 'right-handed',
        basePrice: 1000000,
        stats: { matches: 350, runs: 10000, stumpings: 200, catches: 300 }
      },
      {
        name: 'KL Rahul',
        age: 31,
        nationality: 'Indian',
        role: 'batsman',
        battingStyle: 'right-handed',
        basePrice: 1400000,
        stats: { matches: 180, runs: 8000, average: 42.1 }
      },
      {
        name: 'Mohammed Shami',
        age: 33,
        nationality: 'Indian',
        role: 'bowler',
        bowlingStyle: 'fast',
        basePrice: 1100000,
        stats: { matches: 150, wickets: 300, economy: 8.1 }
      },
      {
        name: 'Hardik Pandya',
        age: 30,
        nationality: 'Indian',
        role: 'all-rounder',
        battingStyle: 'right-handed',
        bowlingStyle: 'medium',
        basePrice: 1300000,
        stats: { matches: 120, runs: 4000, wickets: 120 }
      },
      {
        name: 'Rishabh Pant',
        age: 26,
        nationality: 'Indian',
        role: 'wicket-keeper',
        battingStyle: 'left-handed',
        basePrice: 900000,
        stats: { matches: 100, runs: 3500, stumpings: 80, catches: 120 }
      },
      {
        name: 'Yuzvendra Chahal',
        age: 33,
        nationality: 'Indian',
        role: 'bowler',
        bowlingStyle: 'leg-spin',
        basePrice: 800000,
        stats: { matches: 120, wickets: 200, economy: 7.8 }
      }
    ];

    for (const playerInfo of playerData) {
      const player = await Player.findOneAndUpdate(
        { name: playerInfo.name },
        {
          ...playerInfo,
          currentPrice: playerInfo.basePrice,
          isSold: false,
          isActive: true
        },
        { upsert: true, new: true }
      );
      players.push(player);
    }

    // Create sample auction room
    const auctionRoom = await AuctionRoom.findOneAndUpdate(
      { name: 'IPL 2024 Mega Auction' },
      {
        name: 'IPL 2024 Mega Auction',
        description: 'The biggest cricket player auction of the year with top players from around the world',
        status: 'waiting',
        players: players.map(p => p._id),
        teams: teams.map(t => t._id),
        maxTeams: 8,
        minBidIncrement: 50000,
        timePerBid: 30,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Start tomorrow
        isActive: true
      },
      { upsert: true, new: true }
    );

    // Initialize per-auction player states so this room has its own pricing/sold flags
    for (const p of players) {
      await AuctionPlayer.findOneAndUpdate(
        { auctionRoomId: auctionRoom._id, playerId: p._id },
        {
          auctionRoomId: auctionRoom._id,
          playerId: p._id,
          basePrice: p.basePrice,
          currentPrice: p.basePrice,
          isSold: false,
          isActive: true,
        },
        { upsert: true, new: true }
      );
    }

    console.log('✅ Database seeded successfully!');
    console.log(`👥 Created ${teamOwners.length} team owners`);
    console.log(`🏏 Created ${teams.length} teams`);
    console.log(`🎯 Created ${players.length} players`);
    console.log(`🏟️ Created 1 auction room`);
    console.log(`🔑 Admin credentials: admin@cricketbidder.com / admin123`);
    console.log(`🔑 Team owner credentials: [username]@example.com / password123`);

    return {
      admin,
      teamOwners,
      teams,
      players,
      auctionRoom
    };

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}; 