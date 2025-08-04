'use client';

import { Button, Card, CardBody, CardHeader, Chip, Divider } from '@nextui-org/react';
import { Trophy, Users, DollarSign, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Cricket Bidder
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Experience the thrill of cricket player auctions. Bid on your favorite players
            and build the ultimate cricket team.
          </p>
          <div className="flex gap-4 justify-center">
            <Button color="primary" size="lg">
              Start Bidding
            </Button>
            <Button variant="bordered" size="lg">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardBody className="p-6">
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Live Auctions</h3>
              <p className="text-gray-600">Participate in real-time player auctions</p>
            </CardBody>
          </Card>

          <Card className="text-center">
            <CardBody className="p-6">
              <Users className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Team Management</h3>
              <p className="text-gray-600">Build and manage your cricket team</p>
            </CardBody>
          </Card>

          <Card className="text-center">
            <CardBody className="p-6">
              <DollarSign className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Budget Control</h3>
              <p className="text-gray-600">Manage your auction budget wisely</p>
            </CardBody>
          </Card>

          <Card className="text-center">
            <CardBody className="p-6">
              <TrendingUp className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Player Stats</h3>
              <p className="text-gray-600">Detailed player statistics and performance</p>
            </CardBody>
          </Card>
        </div>

        {/* Current Auctions Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Current Auctions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
                <p className="text-tiny uppercase font-bold">IPL 2024</p>
                <h4 className="font-bold text-large">Mumbai Indians</h4>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
                <p className="text-default-500 mb-4">
                  Bidding for top players in the upcoming season
                </p>
                <div className="flex justify-between items-center">
                  <Chip color="success" variant="flat">Active</Chip>
                  <Button size="sm" color="primary">
                    Join Auction
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
                <p className="text-tiny uppercase font-bold">IPL 2024</p>
                <h4 className="font-bold text-large">Chennai Super Kings</h4>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
                <p className="text-default-500 mb-4">
                  Strategic bidding for experienced players
                </p>
                <div className="flex justify-between items-center">
                  <Chip color="warning" variant="flat">Starting Soon</Chip>
                  <Button size="sm" color="primary">
                    Join Auction
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
                <p className="text-tiny uppercase font-bold">IPL 2024</p>
                <h4 className="font-bold text-large">Royal Challengers</h4>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
                <p className="text-default-500 mb-4">
                  High-stakes bidding for star players
                </p>
                <div className="flex justify-between items-center">
                  <Chip color="secondary" variant="flat">Upcoming</Chip>
                  <Button size="sm" color="primary">
                    Join Auction
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 