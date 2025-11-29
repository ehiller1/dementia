import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, MessageSquare, Brain, Layers, Sparkles, TrendingUp, Zap, GitBranch, Users, ArrowRight, Shield, Rocket } from "lucide-react";
import AuthModal from '@/components/auth/AuthModal';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useEffect } from "react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useSupabaseAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Redirect to /home if already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate('/home', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGetStarted = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Brain className="h-12 w-12 text-violet-600" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              AMIGO Intelligence Platform
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Your AI-enabled management team for intelligent decision-making and orchestration
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-8 py-6 text-lg"
          >
            <Rocket className="h-5 w-5 mr-2" />
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="border-violet-200 bg-white/95 backdrop-blur shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-violet-600" />
                Conversational AI
              </CardTitle>
              <CardDescription>
                Interact with your AI management team through natural language
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Ask questions, get insights, and make decisions with the power of AI agents working together.
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-white/95 backdrop-blur shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                Live Insights
              </CardTitle>
              <CardDescription>
                Real-time narratives and agent responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Watch as AI agents collaborate and provide real-time insights into your business operations.
              </p>
            </CardContent>
          </Card>

          <Card className="border-fuchsia-200 bg-white/95 backdrop-blur shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-6 w-6 text-fuchsia-600" />
                Decision Inbox
              </CardTitle>
              <CardDescription>
                Track and manage pending actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                See what templates are being used, which agents are executing, and why decisions are made.
              </p>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 bg-white/95 backdrop-blur shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-indigo-600" />
                Memory System
              </CardTitle>
              <CardDescription>
                Short & long-term context retention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Your AI remembers past conversations and learns from interactions to provide better insights.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-white/95 backdrop-blur shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-6 w-6 text-blue-600" />
                Workflow Orchestration
              </CardTitle>
              <CardDescription>
                Intelligent workflow management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Automate complex business processes with AI-driven workflow orchestration.
              </p>
            </CardContent>
          </Card>

          <Card className="border-pink-200 bg-white/95 backdrop-blur shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-pink-600" />
                Multi-Agent System
              </CardTitle>
              <CardDescription>
                Specialized AI agents for different tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Leverage a team of specialized AI agents, each expert in their domain, working together seamlessly.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="border-violet-300 bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-2xl">
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-violet-200" />
              <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-violet-100 mb-6 max-w-2xl mx-auto">
                Sign in to access your AI management team and start making intelligent decisions today.
              </p>
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                variant="secondary"
                className="bg-white text-violet-600 hover:bg-violet-50 px-8 py-6 text-lg"
              >
                Sign In to Continue
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Dashboard;

