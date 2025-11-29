"""
Caregiver Training Service
Analyzes conversations and provides feedback on interaction quality
Based on memory care best practices and dementia care philosophy
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime
import re
from sqlalchemy.orm import Session

from ..models import Patient, User


class CarePhilosophy:
    """
    Core care philosophy and principles for dementia interaction
    """
    
    # Core principles
    PRINCIPLES = {
        "ritual_over_stimulation": {
            "title": "Ritual Over Stimulation",
            "description": "Novelty creates anxiety. Familiarity creates safety.",
            "weight": 0.25
        },
        "emotion_over_accuracy": {
            "title": "Emotion Over Accuracy",
            "description": "Respond to feelings, not facts. Correctness is optional. Comfort is not.",
            "weight": 0.30
        },
        "presence_over_performance": {
            "title": "Presence Over Performance",
            "description": "No one is asked to remember, improve, or succeed.",
            "weight": 0.25
        },
        "short_steady_repeatable": {
            "title": "Short, Steady, Repeatable",
            "description": "Better to return tomorrow than overwhelm today.",
            "weight": 0.20
        }
    }
    
    # Ideal session structure (7 minutes)
    IDEAL_SESSION = {
        "duration_minutes": 7,
        "phases": [
            {
                "name": "Arrival",
                "duration": "0-1 min",
                "purpose": "Predictability & Safety",
                "example": "Good morning, [Name]. It's time for our visit. I'm here with you.",
                "key_points": [
                    "Use their name",
                    "Say 'visit' not 'session'",
                    "State presence before purpose",
                    "Pause - don't rush"
                ]
            },
            {
                "name": "Gentle Orientation",
                "duration": "1-2 min",
                "purpose": "Orientation Without Testing",
                "example": "It's a calm morning. You're at home, and things are okay right now.",
                "key_points": [
                    "Never ask 'Do you know...?'",
                    "Never wait for confirmation",
                    "Orientation is offered, not requested",
                    "No testing"
                ]
            },
            {
                "name": "Familiar Thread",
                "duration": "2-4 min",
                "purpose": "Memory Without Recall Pressure",
                "example": "I was thinking about your garden today. You always seemed to enjoy being around plants.",
                "key_points": [
                    "No 'when', 'who', or 'what year'",
                    "Use 'Tell me', 'How did it feel', 'What did you like'",
                    "Repetition is success",
                    "Follow emotion, not facts"
                ]
            },
            {
                "name": "Emotional Reflection",
                "duration": "4-5 min",
                "purpose": "Identity Support",
                "example": "When you talk about that, you sound calm. That seems like something you cared about.",
                "key_points": [
                    "Reflect who they are, not what they remember",
                    "Acknowledge emotions",
                    "Let them respond or sit quietly",
                    "This minute is crucial"
                ]
            },
            {
                "name": "Gentle Presence",
                "duration": "5-6 min",
                "purpose": "No Performance Required",
                "example": "We can stay here with that feeling for a moment. It's okay to rest.",
                "key_points": [
                    "Silence is allowed",
                    "No pressure to speak",
                    "If tired, validate that",
                    "Presence over conversation"
                ]
            },
            {
                "name": "Consistent Closing",
                "duration": "6-7 min",
                "purpose": "Trust & Continuity",
                "example": "Thank you for spending this time with me. I'll visit you again tomorrow.",
                "key_points": [
                    "Always the same closing",
                    "No recap",
                    "No instruction",
                    "No 'goodbye forever'",
                    "Promise return"
                ]
            }
        ]
    }


class ConversationAnalyzer:
    """
    Analyzes caregiver-patient conversations for quality and best practices
    """
    
    def __init__(self):
        self.philosophy = CarePhilosophy()
    
    def analyze_conversation(
        self,
        conversation_text: str,
        caregiver_name: str,
        patient_name: str,
        dementia_stage: str = "moderate"
    ) -> Dict:
        """
        Analyze a conversation and provide detailed feedback
        
        Args:
            conversation_text: Full conversation transcript
            caregiver_name: Name of caregiver/family member
            patient_name: Name of patient
            dementia_stage: early, moderate, late
            
        Returns:
            Comprehensive analysis with scores and recommendations
        """
        
        # Parse conversation into turns
        turns = self._parse_conversation(conversation_text, caregiver_name, patient_name)
        
        # Analyze each principle
        principle_scores = {}
        for principle_key, principle in self.philosophy.PRINCIPLES.items():
            score = self._score_principle(turns, principle_key, dementia_stage)
            principle_scores[principle_key] = score
        
        # Detect violations (what NOT to do)
        violations = self._detect_violations(turns, dementia_stage)
        
        # Identify strengths (what they did well)
        strengths = self._identify_strengths(turns, dementia_stage)
        
        # Generate specific recommendations
        recommendations = self._generate_recommendations(
            turns, principle_scores, violations, dementia_stage
        )
        
        # Calculate overall score
        overall_score = self._calculate_overall_score(principle_scores)
        
        # Determine session phase alignment
        phase_analysis = self._analyze_phases(turns)
        
        return {
            "overall_score": overall_score,
            "grade": self._score_to_grade(overall_score),
            "principle_scores": principle_scores,
            "violations": violations,
            "strengths": strengths,
            "recommendations": recommendations,
            "phase_analysis": phase_analysis,
            "turn_count": len(turns),
            "conversation_length": len(conversation_text),
            "dementia_stage": dementia_stage
        }
    
    def _parse_conversation(
        self,
        conversation_text: str,
        caregiver_name: str,
        patient_name: str
    ) -> List[Dict]:
        """
        Parse conversation into structured turns
        """
        
        turns = []
        lines = conversation_text.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Try to detect speaker
            if line.lower().startswith(caregiver_name.lower() + ':'):
                speaker = "caregiver"
                text = line[len(caregiver_name)+1:].strip()
            elif line.lower().startswith(patient_name.lower() + ':'):
                speaker = "patient"
                text = line[len(patient_name)+1:].strip()
            elif ':' in line:
                # Generic format "Speaker: text"
                parts = line.split(':', 1)
                speaker_text = parts[0].strip().lower()
                if 'caregiver' in speaker_text or 'family' in speaker_text:
                    speaker = "caregiver"
                elif 'patient' in speaker_text or 'elder' in speaker_text:
                    speaker = "patient"
                else:
                    speaker = "unknown"
                text = parts[1].strip()
            else:
                speaker = "unknown"
                text = line
            
            turns.append({
                "speaker": speaker,
                "text": text,
                "text_lower": text.lower()
            })
        
        return turns
    
    def _score_principle(
        self,
        turns: List[Dict],
        principle: str,
        stage: str
    ) -> Dict:
        """
        Score adherence to a specific principle
        
        Returns score (0-1) and evidence
        """
        
        caregiver_turns = [t for t in turns if t["speaker"] == "caregiver"]
        
        if principle == "ritual_over_stimulation":
            return self._score_ritual_consistency(caregiver_turns)
        
        elif principle == "emotion_over_accuracy":
            return self._score_emotional_validation(caregiver_turns, turns)
        
        elif principle == "presence_over_performance":
            return self._score_no_pressure(caregiver_turns)
        
        elif principle == "short_steady_repeatable":
            return self._score_brevity_structure(caregiver_turns)
        
        return {"score": 0.5, "evidence": []}
    
    def _score_ritual_consistency(self, caregiver_turns: List[Dict]) -> Dict:
        """
        Score: Do they follow a predictable structure?
        """
        
        evidence = []
        score = 0.7  # Start optimistic
        
        if not caregiver_turns:
            return {"score": 0, "evidence": ["No caregiver statements detected"]}
        
        # Check for greeting
        first_turn = caregiver_turns[0]["text_lower"]
        if any(word in first_turn for word in ['good morning', 'good afternoon', 'hello', 'hi']):
            score += 0.1
            evidence.append("✓ Started with a greeting")
        else:
            score -= 0.1
            evidence.append("✗ Missing greeting at start")
        
        # Check for name usage
        # (Would need patient name to check this properly)
        
        # Check for consistent structure words
        structure_words = ['today', 'time for', 'visit', 'together']
        if any(any(word in turn["text_lower"] for word in structure_words) for turn in caregiver_turns[:3]):
            score += 0.1
            evidence.append("✓ Used structure words early")
        
        # Check for closing
        if caregiver_turns:
            last_turn = caregiver_turns[-1]["text_lower"]
            if any(word in last_turn for word in ['thank you', 'see you', 'tomorrow', 'next time']):
                score += 0.1
                evidence.append("✓ Included proper closing")
            else:
                score -= 0.1
                evidence.append("✗ Missing clear closing")
        
        return {
            "score": min(1.0, max(0.0, score)),
            "evidence": evidence
        }
    
    def _score_emotional_validation(
        self,
        caregiver_turns: List[Dict],
        all_turns: List[Dict]
    ) -> Dict:
        """
        Score: Do they validate emotions rather than correct facts?
        """
        
        evidence = []
        score = 0.7
        
        # Check for validation phrases
        validation_phrases = [
            'i understand', 'that sounds', 'i hear you', 'that must',
            'it seems', 'you feel', 'that\'s important', 'i can see'
        ]
        
        validation_count = sum(
            1 for turn in caregiver_turns
            if any(phrase in turn["text_lower"] for phrase in validation_phrases)
        )
        
        if validation_count > 0:
            score += min(0.2, validation_count * 0.1)
            evidence.append(f"✓ Used {validation_count} validation phrase(s)")
        else:
            score -= 0.15
            evidence.append("✗ No emotional validation detected")
        
        # Check for correction/testing (BAD)
        correction_phrases = [
            'no, actually', 'that\'s not right', 'remember when', 'don\'t you remember',
            'try to remember', 'you forgot', 'that\'s wrong', 'no, it was'
        ]
        
        correction_count = sum(
            1 for turn in caregiver_turns
            if any(phrase in turn["text_lower"] for phrase in correction_phrases)
        )
        
        if correction_count > 0:
            score -= min(0.3, correction_count * 0.15)
            evidence.append(f"✗ Corrected or tested {correction_count} time(s) - AVOID THIS")
        else:
            score += 0.1
            evidence.append("✓ Did not correct or test memory")
        
        return {
            "score": min(1.0, max(0.0, score)),
            "evidence": evidence
        }
    
    def _score_no_pressure(self, caregiver_turns: List[Dict]) -> Dict:
        """
        Score: Do they avoid putting pressure to perform/remember?
        """
        
        evidence = []
        score = 0.8
        
        # Check for testing questions (BAD)
        testing_patterns = [
            r'\bdo you remember\b',
            r'\bwhat year\b',
            r'\bwho was\b',
            r'\bwhen did\b',
            r'\btry to\b',
            r'\bcan you recall\b'
        ]
        
        testing_count = 0
        for turn in caregiver_turns:
            for pattern in testing_patterns:
                if re.search(pattern, turn["text_lower"]):
                    testing_count += 1
                    break
        
        if testing_count > 0:
            score -= min(0.4, testing_count * 0.15)
            evidence.append(f"✗ Asked {testing_count} testing question(s) - AVOID THIS")
        else:
            score += 0.1
            evidence.append("✓ No testing or memory quizzes")
        
        # Check for gentle invitations (GOOD)
        invitation_phrases = [
            'if you\'d like', 'would you like', 'we can', 'it\'s okay',
            'no need to', 'take your time', 'when you\'re ready'
        ]
        
        invitation_count = sum(
            1 for turn in caregiver_turns
            if any(phrase in turn["text_lower"] for phrase in invitation_phrases)
        )
        
        if invitation_count > 0:
            score += min(0.15, invitation_count * 0.05)
            evidence.append(f"✓ Used {invitation_count} gentle invitation(s)")
        
        return {
            "score": min(1.0, max(0.0, score)),
            "evidence": evidence
        }
    
    def _score_brevity_structure(self, caregiver_turns: List[Dict]) -> Dict:
        """
        Score: Are statements short and structured?
        """
        
        evidence = []
        score = 0.7
        
        if not caregiver_turns:
            return {"score": 0, "evidence": []}
        
        # Check average sentence length
        total_words = sum(len(turn["text"].split()) for turn in caregiver_turns)
        avg_words = total_words / len(caregiver_turns)
        
        if avg_words <= 12:
            score += 0.2
            evidence.append(f"✓ Average {avg_words:.1f} words per statement (ideal: ≤12)")
        elif avg_words <= 18:
            score += 0.1
            evidence.append(f"◐ Average {avg_words:.1f} words per statement (acceptable: ≤18)")
        else:
            score -= 0.1
            evidence.append(f"✗ Average {avg_words:.1f} words per statement (too long: >18)")
        
        # Check for run-on sentences
        long_statements = [t for t in caregiver_turns if len(t["text"].split()) > 25]
        if long_statements:
            score -= min(0.2, len(long_statements) * 0.05)
            evidence.append(f"✗ {len(long_statements)} statement(s) over 25 words - break these up")
        else:
            score += 0.1
            evidence.append("✓ All statements appropriately sized")
        
        return {
            "score": min(1.0, max(0.0, score)),
            "evidence": evidence
        }
    
    def _detect_violations(
        self,
        turns: List[Dict],
        stage: str
    ) -> List[Dict]:
        """
        Detect specific violations of best practices
        """
        
        violations = []
        caregiver_turns = [t for t in turns if t["speaker"] == "caregiver"]
        
        # Critical violations
        for i, turn in enumerate(caregiver_turns):
            text_lower = turn["text_lower"]
            
            # Testing memory
            if any(phrase in text_lower for phrase in ['do you remember', 'try to remember', 'don\'t you remember']):
                violations.append({
                    "severity": "high",
                    "type": "memory_testing",
                    "turn_number": i + 1,
                    "text": turn["text"][:100],
                    "issue": "Testing memory creates anxiety and shame",
                    "correction": "Instead ask: 'What did you like about that?' or 'Tell me more about that'"
                })
            
            # Correction
            if any(phrase in text_lower for phrase in ['no, actually', 'that\'s not right', 'that\'s wrong']):
                violations.append({
                    "severity": "high",
                    "type": "correction",
                    "turn_number": i + 1,
                    "text": turn["text"][:100],
                    "issue": "Correcting creates conflict and distress",
                    "correction": "Validate their emotion: 'That sounds important to you' or 'I can see why you'd think that'"
                })
            
            # Giving choices (can be overwhelming)
            if text_lower.count('or') >= 2:  # Multiple options
                violations.append({
                    "severity": "medium",
                    "type": "too_many_choices",
                    "turn_number": i + 1,
                    "text": turn["text"][:100],
                    "issue": "Multiple choices increase confusion",
                    "correction": "Simplify to one option or no choice: 'It's time for lunch' vs 'Do you want lunch now or later?'"
                })
            
            # Rapid questions
            if text_lower.count('?') >= 3:
                violations.append({
                    "severity": "medium",
                    "type": "too_many_questions",
                    "turn_number": i + 1,
                    "text": turn["text"][:100],
                    "issue": "Multiple questions create pressure",
                    "correction": "One question at a time, or statements instead: 'I'm curious about your garden' vs asking multiple garden questions"
                })
        
        return violations
    
    def _identify_strengths(
        self,
        turns: List[Dict],
        stage: str
    ) -> List[str]:
        """
        Identify what the caregiver did well
        """
        
        strengths = []
        caregiver_turns = [t for t in turns if t["speaker"] == "caregiver"]
        
        # Check for good practices
        for turn in caregiver_turns:
            text_lower = turn["text_lower"]
            
            # Validation
            if any(phrase in text_lower for phrase in ['that sounds', 'i understand', 'i hear you']):
                strengths.append("Used emotional validation")
                break
        
        # Gentle language
        if any('take your time' in t["text_lower"] for t in caregiver_turns):
            strengths.append("Gave permission to go slow")
        
        # No pressure
        testing_found = any(
            'remember' in t["text_lower"] and '?' in t["text"]
            for t in caregiver_turns
        )
        if not testing_found:
            strengths.append("Avoided testing memory")
        
        # Used name
        # (Would need patient name to verify)
        
        # Short sentences
        short_statements = [t for t in caregiver_turns if len(t["text"].split()) <= 12]
        if len(short_statements) / len(caregiver_turns) > 0.7 if caregiver_turns else False:
            strengths.append("Kept statements short and clear")
        
        # Presence language
        if any(phrase in t["text_lower"] for t in caregiver_turns for phrase in ['i\'m here', 'together', 'with you']):
            strengths.append("Emphasized presence and togetherness")
        
        return list(set(strengths))  # Remove duplicates
    
    def _generate_recommendations(
        self,
        turns: List[Dict],
        scores: Dict,
        violations: List[Dict],
        stage: str
    ) -> List[Dict]:
        """
        Generate specific, actionable recommendations
        """
        
        recommendations = []
        
        # Based on scores
        for principle, score_data in scores.items():
            if score_data["score"] < 0.6:
                rec = self._get_principle_recommendation(principle, stage)
                if rec:
                    recommendations.append(rec)
        
        # Based on violations
        if violations:
            high_severity = [v for v in violations if v["severity"] == "high"]
            if high_severity:
                recommendations.insert(0, {
                    "priority": "immediate",
                    "category": "critical",
                    "title": "Stop Testing Memory",
                    "description": "Asking 'Do you remember?' creates anxiety. Memory loss is the core symptom—testing it causes shame.",
                    "action": "Replace memory questions with feeling questions: 'What did you enjoy about that?' or 'How did that make you feel?'",
                    "example": "Instead of 'Do you remember our trip?' say 'I was thinking about our trip. You seemed happy then.'"
                })
        
        # Stage-specific recommendations
        if stage == "early":
            recommendations.append({
                "priority": "high",
                "category": "stage_specific",
                "title": "Early Stage: Affirm Competence",
                "description": "In early dementia, the person is very aware of their losses. Avoid any framing around 'memory improvement' or 'cognitive exercises.'",
                "action": "Frame interactions as social visits, not therapy. Normalize difficulty: 'Everyone has trouble with names sometimes.'",
                "example": "'This is just a quiet visit' not 'Let's work on your memory today'"
            })
        
        elif stage == "moderate":
            recommendations.append({
                "priority": "high",
                "category": "stage_specific",
                "title": "Moderate Stage: Rhythm & Repetition",
                "description": "At this stage, ritual matters more than conversation quality. Same time, same words, same structure.",
                "action": "Use the exact same opening and closing every visit. Repeat favorite topics often—repetition is success.",
                "example": "Same greeting daily: 'Good morning, [Name]. It's time for our visit. I'm here with you.'"
            })
        
        elif stage == "late":
            recommendations.append({
                "priority": "high",
                "category": "stage_specific",
                "title": "Late Stage: Presence Over Words",
                "description": "Language may be minimal. Your tone and presence matter more than words. Very short sessions (3-5 min).",
                "action": "Reduce questions. Use more statements. Accept long silences. Focus on calming the nervous system.",
                "example": "'You're not alone. I'm here.' Then sit quietly together."
            })
        
        # Add general best practice if needed
        if not recommendations:
            recommendations.append({
                "priority": "medium",
                "category": "improvement",
                "title": "Structure Your Visit",
                "description": "Follow the ideal 7-minute structure: Arrival → Orientation → Familiar Thread → Reflection → Presence → Closing",
                "action": "Each phase has a purpose. Don't rush. Silence is okay. Repetition tomorrow is expected.",
                "example": "See the full 7-minute ideal session script for details."
            })
        
        return recommendations
    
    def _calculate_overall_score(self, principle_scores: Dict) -> float:
        """
        Calculate weighted overall score
        """
        
        total = 0
        for principle_key, score_data in principle_scores.items():
            weight = self.philosophy.PRINCIPLES[principle_key]["weight"]
            total += score_data["score"] * weight
        
        return round(total, 2)
    
    def _score_to_grade(self, score: float) -> str:
        """Convert score to letter grade"""
        if score >= 0.90:
            return "A"
        elif score >= 0.80:
            return "B"
        elif score >= 0.70:
            return "C"
        elif score >= 0.60:
            return "D"
        else:
            return "F"
    
    def _analyze_phases(self, turns: List[Dict]) -> Dict:
        """
        Analyze if conversation follows ideal phase structure
        """
        
        caregiver_turns = [t for t in turns if t["speaker"] == "caregiver"]
        
        if not caregiver_turns:
            return {
                "follows_structure": False,
                "detected_phases": [],
                "missing_phases": list(self.philosophy.IDEAL_SESSION["phases"])
            }
        
        detected_phases = []
        
        # Check for arrival
        first_text = caregiver_turns[0]["text_lower"]
        if any(word in first_text for word in ['good morning', 'good afternoon', 'hello', 'time for']):
            detected_phases.append("Arrival")
        
        # Check for orientation
        if any(word in turn["text_lower"] for turn in caregiver_turns[:3] for word in ['today', 'at home', 'okay', 'calm']):
            detected_phases.append("Gentle Orientation")
        
        # Check for familiar thread
        if any('you' in turn["text_lower"] and any(word in turn["text_lower"] for word in ['like', 'enjoy', 'loved', 'always']) for turn in caregiver_turns):
            detected_phases.append("Familiar Thread")
        
        # Check for emotional reflection
        if any(word in turn["text_lower"] for turn in caregiver_turns for word in ['sound', 'seem', 'feel', 'care']):
            detected_phases.append("Emotional Reflection")
        
        # Check for closing
        if caregiver_turns:
            last_text = caregiver_turns[-1]["text_lower"]
            if any(word in last_text for word in ['thank you', 'tomorrow', 'next time', 'see you']):
                detected_phases.append("Consistent Closing")
        
        all_phase_names = [p["name"] for p in self.philosophy.IDEAL_SESSION["phases"]]
        missing_phases = [p for p in all_phase_names if p not in detected_phases]
        
        return {
            "follows_structure": len(detected_phases) >= 4,
            "detected_phases": detected_phases,
            "missing_phases": missing_phases,
            "phase_count": len(detected_phases)
        }
    
    def _get_principle_recommendation(self, principle: str, stage: str) -> Optional[Dict]:
        """Get recommendation for low-scoring principle"""
        
        recommendations_map = {
            "ritual_over_stimulation": {
                "priority": "high",
                "category": "structure",
                "title": "Create Predictable Ritual",
                "description": "Novelty increases anxiety in dementia. Use the same words, same time, same structure every visit.",
                "action": "Write a script for your opening and closing. Use it every time, word-for-word.",
                "example": "Opening: 'Good morning, [Name]. It's time for our visit. I'm here with you.' Closing: 'Thank you for this time. I'll see you tomorrow.'"
            },
            "emotion_over_accuracy": {
                "priority": "immediate",
                "category": "communication",
                "title": "Validate Feelings, Not Facts",
                "description": "Correcting their reality creates conflict. Their emotions are always valid, even if facts aren't.",
                "action": "When they say something incorrect, respond to the feeling behind it instead of correcting.",
                "example": "If they say 'I need to pick up the kids' (who are grown), say: 'You're a caring parent' not 'Your kids are adults now.'"
            },
            "presence_over_performance": {
                "priority": "high",
                "category": "approach",
                "title": "Remove All Pressure",
                "description": "Never ask them to remember, perform, or succeed. Your presence is the gift.",
                "action": "Replace questions with statements. Give permission to rest. Accept silence.",
                "example": "'We can just sit together' not 'Can you tell me about...?' Silence is companionship."
            },
            "short_steady_repeatable": {
                "priority": "medium",
                "category": "structure",
                "title": "Keep It Brief",
                "description": "Short visits prevent fatigue. Better to return daily than overwhelm today.",
                "action": "Aim for 5-7 minutes. Use short sentences (10-12 words max). One idea per sentence.",
                "example": "'I'm here with you.' (pause) 'Today is calm.' (pause) Not: 'I'm here with you today and wanted to see how you're doing and talk about the garden...'"
            }
        }
        
        return recommendations_map.get(principle)


class CaregiverTrainingService:
    """
    Main service for caregiver training
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.analyzer = ConversationAnalyzer()
    
    def analyze_training_session(
        self,
        conversation_text: str,
        caregiver_id: int,
        patient_id: int
    ) -> Dict:
        """
        Analyze a training conversation and provide feedback
        """
        
        # Get patient info
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise ValueError("Patient not found")
        
        # Get caregiver info
        caregiver = self.db.query(User).filter(User.id == caregiver_id).first()
        if not caregiver:
            raise ValueError("Caregiver not found")
        
        # Determine dementia stage
        dementia_stage = patient.dementia_stage.value if patient.dementia_stage else "moderate"
        
        # Analyze conversation
        analysis = self.analyzer.analyze_conversation(
            conversation_text=conversation_text,
            caregiver_name=caregiver.full_name.split()[0],  # First name
            patient_name=patient.user.full_name.split()[0],  # First name
            dementia_stage=dementia_stage
        )
        
        # Add context
        analysis["patient_name"] = patient.user.full_name
        analysis["caregiver_name"] = caregiver.full_name
        analysis["analyzed_at"] = datetime.utcnow().isoformat()
        
        return analysis
    
    def get_ideal_script(self, dementia_stage: str = "moderate") -> Dict:
        """
        Get the ideal 7-minute visit script
        """
        
        philosophy = CarePhilosophy()
        return philosophy.IDEAL_SESSION
    
    def get_care_philosophy(self) -> Dict:
        """
        Get complete care philosophy
        """
        
        philosophy = CarePhilosophy()
        return {
            "principles": philosophy.PRINCIPLES,
            "ideal_session": philosophy.IDEAL_SESSION,
            "one_line_ethos": "We build daily rituals that help people with memory loss feel present and expected—without asking them to remember why."
        }
