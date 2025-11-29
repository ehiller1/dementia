/**
 * Call Center Coaching Scenarios
 * Different conversation scripts that trigger various coaching types
 */

export interface ScenarioTurn {
  speaker: 'customer' | 'rep';
  text: string;
  delay: number;
  error?: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  primaryCoach: string;
  repProfile: {
    skill_level: 'novice' | 'intermediate' | 'expert';
    tenure_months: number;
    top_training_needs: string[];
  };
  customerProfile: {
    segment: string;
    sentiment_tendency: string;
  };
  transcript: ScenarioTurn[];
}

export const COACHING_SCENARIOS: Record<string, Scenario> = {
  // Scenario 1: Empathy & Policy Issues (Original)
  hotel_overbooking: {
    id: 'hotel_overbooking',
    name: 'Hotel Overbooking Crisis',
    description: 'Tests empathy, verification, and policy compliance',
    primaryCoach: 'EmpathyCoach, PolicyCoach',
    repProfile: {
      skill_level: 'novice',
      tenure_months: 3,
      top_training_needs: ['empathy', 'policy_adherence']
    },
    customerProfile: {
      segment: 'business',
      sentiment_tendency: 'impatient'
    },
    transcript: [
      {
        speaker: 'customer',
        text: 'Hi, I just arrived at the hotel and they say you\'re overbooked. I don\'t have a room!',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'Can you give me your confirmation number?',
        delay: 2000,
        error: 'no_empathy'
      },
      {
        speaker: 'customer',
        text: 'It\'s ABC123. This is ridiculous and very frustrating!',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'I see your booking here in the system.',
        delay: 2000,
        error: 'missing_verification'
      },
      {
        speaker: 'customer',
        text: 'This has ruined my trip. I want a full refund immediately.',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'Okay, I\'ll refund everything right now.',
        delay: 2000,
        error: 'policy_violation'
      },
      {
        speaker: 'customer',
        text: 'Fine. I travel for business often so this is really disappointing.',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'You\'ll get an email confirmation shortly. Goodbye.',
        delay: 2000,
        error: 'missed_upsell'
      }
    ]
  },

  // Scenario 2: Upsell Opportunities
  flight_upgrade: {
    id: 'flight_upgrade',
    name: 'Flight Upgrade Opportunity',
    description: 'Tests consultative selling and upsell skills',
    primaryCoach: 'UpsellCoach',
    repProfile: {
      skill_level: 'intermediate',
      tenure_months: 8,
      top_training_needs: ['upsell', 'discovery']
    },
    customerProfile: {
      segment: 'leisure',
      sentiment_tendency: 'calm'
    },
    transcript: [
      {
        speaker: 'customer',
        text: 'Hi, I\'d like to check on my flight reservation for next week.',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'Of course! Can I have your confirmation number please?',
        delay: 2000
      },
      {
        speaker: 'customer',
        text: 'Yes, it\'s FL987654. I\'m flying to Hawaii for my anniversary.',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'Great, I can see your reservation. Everything looks good for your flight.',
        delay: 2000,
        error: 'missed_upsell'
      },
      {
        speaker: 'customer',
        text: 'Perfect. This is a really special trip - our 25th anniversary.',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'Wonderful! Your flight departs at 9 AM. Is there anything else?',
        delay: 2000,
        error: 'missed_upsell'
      },
      {
        speaker: 'customer',
        text: 'No, that\'s it. We\'re both really excited about this vacation.',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'Have a great trip! See you on board.',
        delay: 2000,
        error: 'missed_upsell'
      }
    ]
  },

  // Scenario 3: De-escalation Required
  angry_customer: {
    id: 'angry_customer',
    name: 'Angry Customer Escalation',
    description: 'Tests de-escalation and conflict resolution',
    primaryCoach: 'DeEscalationCoach, EmpathyCoach',
    repProfile: {
      skill_level: 'novice',
      tenure_months: 2,
      top_training_needs: ['empathy', 'conflict_resolution']
    },
    customerProfile: {
      segment: 'vip',
      sentiment_tendency: 'angry'
    },
    transcript: [
      {
        speaker: 'customer',
        text: 'This is absolutely unacceptable! My package was supposed to arrive yesterday!',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'Let me look up your tracking number.',
        delay: 2000,
        error: 'no_empathy'
      },
      {
        speaker: 'customer',
        text: 'I don\'t have time for this! I need to speak with your manager RIGHT NOW!',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'Please calm down. Let me just check the system first.',
        delay: 2000,
        error: 'escalation_risk'
      },
      {
        speaker: 'customer',
        text: 'Don\'t tell me to calm down! This is the third time this has happened!',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'I see the issue. The package is delayed. There\'s nothing I can do.',
        delay: 2000,
        error: 'escalation_risk'
      },
      {
        speaker: 'customer',
        text: 'This is ridiculous! I want to cancel my account!',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'Okay, I can process a cancellation if that\'s what you want.',
        delay: 2000,
        error: 'escalation_risk'
      }
    ]
  },

  // Scenario 4: Policy & Compliance Focus
  security_breach: {
    id: 'security_breach',
    name: 'Account Security Issue',
    description: 'Tests security protocols and policy compliance',
    primaryCoach: 'PolicyCoach',
    repProfile: {
      skill_level: 'intermediate',
      tenure_months: 6,
      top_training_needs: ['policy_adherence', 'system_navigation']
    },
    customerProfile: {
      segment: 'business',
      sentiment_tendency: 'neutral'
    },
    transcript: [
      {
        speaker: 'customer',
        text: 'Hello, I need to update my payment information on my account.',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'Sure, I can help with that. What\'s your account number?',
        delay: 2000
      },
      {
        speaker: 'customer',
        text: 'It\'s ACC-445566.',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'Perfect, I\'m pulling up your account now. I see you have three cards on file.',
        delay: 2000,
        error: 'missing_verification'
      },
      {
        speaker: 'customer',
        text: 'Yes, I want to add a new corporate card.',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'No problem. What\'s the new card number?',
        delay: 2000,
        error: 'missing_verification'
      },
      {
        speaker: 'customer',
        text: 'Before I give that, shouldn\'t you verify my identity?',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'Oh right, what\'s your zip code?',
        delay: 2000,
        error: 'script_noncompliance'
      }
    ]
  },

  // Scenario 5: New Hire Script Non-Compliance
  confused_rep: {
    id: 'confused_rep',
    name: 'New Hire Script Issues',
    description: 'Tests new hire guidance and script adherence',
    primaryCoach: 'NewHireCoach, PolicyCoach',
    repProfile: {
      skill_level: 'novice',
      tenure_months: 1,
      top_training_needs: ['system_navigation', 'script_adherence', 'discovery']
    },
    customerProfile: {
      segment: 'leisure',
      sentiment_tendency: 'calm'
    },
    transcript: [
      {
        speaker: 'customer',
        text: 'Hi, I\'d like to make a reservation for a hotel room.',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'Uh, okay. What city?',
        delay: 2000,
        error: 'script_noncompliance'
      },
      {
        speaker: 'customer',
        text: 'San Francisco, for December 15th to 18th.',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'Okay, let me see... How many people?',
        delay: 2000,
        error: 'script_noncompliance'
      },
      {
        speaker: 'customer',
        text: 'Just two adults. Do you have any rooms available?',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'I\'m not sure how to check that. Hold on...',
        delay: 2000,
        error: 'script_noncompliance'
      },
      {
        speaker: 'customer',
        text: 'Is everything okay? Should I call back?',
        delay: 2000
      },
      {
        speaker: 'rep',
        text: 'No, I found it. We have rooms. Do you want to book?',
        delay: 2000,
        error: 'missed_upsell'
      }
    ]
  }
};

export const SCENARIO_LIST = Object.values(COACHING_SCENARIOS);

