"""
Engagement Analytics Service
Tracks and analyzes patient engagement across all metrics
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from decimal import Decimal

from ..models import (
    EngagementMetric,
    EngagementSummary,
    Patient,
    Conversation,
    RitualSession,
    StorylineSession,
    MemoryAccuracy
)


class EngagementAnalytics:
    """
    Service for tracking and analyzing patient engagement metrics
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    # ========================================================================
    # METRIC RECORDING
    # ========================================================================
    
    def record_engagement(
        self,
        patient_id: int,
        session_data: Dict,
        conversation_id: Optional[int] = None,
        ritual_session_id: Optional[int] = None,
        storyline_session_id: Optional[int] = None
    ) -> EngagementMetric:
        """
        Record detailed engagement metrics for a session
        
        Args:
            patient_id: Patient ID
            session_data: Dictionary with all engagement metrics
            conversation_id: Optional conversation ID
            ritual_session_id: Optional ritual session ID
            storyline_session_id: Optional storyline session ID
            
        Returns:
            Created EngagementMetric instance
        """
        
        # Calculate overall engagement score from components
        overall_score = self._calculate_overall_engagement(session_data)
        
        metric = EngagementMetric(
            patient_id=patient_id,
            conversation_id=conversation_id,
            ritual_session_id=ritual_session_id,
            storyline_session_id=storyline_session_id,
            recorded_at=datetime.utcnow(),
            
            # Verbal metrics
            verbal_response_count=session_data.get('verbal_response_count', 0),
            avg_response_length_words=session_data.get('avg_response_length_words'),
            total_words_spoken=session_data.get('total_words_spoken', 0),
            response_time_seconds=session_data.get('response_time_seconds'),
            verbal_clarity_score=session_data.get('verbal_clarity_score'),
            initiated_conversation=session_data.get('initiated_conversation', False),
            
            # Memory metrics
            memory_prompts_given=session_data.get('memory_prompts_given', 0),
            memory_responses_attempted=session_data.get('memory_responses_attempted', 0),
            memory_accuracy=session_data.get('memory_accuracy'),
            accurate_recalls=session_data.get('accurate_recalls', 0),
            partial_recalls=session_data.get('partial_recalls', 0),
            confabulations=session_data.get('confabulations', 0),
            no_recalls=session_data.get('no_recalls', 0),
            memory_names_recalled=session_data.get('memory_names_recalled', []),
            memory_events_recalled=session_data.get('memory_events_recalled', []),
            memory_dates_recalled=session_data.get('memory_dates_recalled', []),
            memory_places_recalled=session_data.get('memory_places_recalled', []),
            recall_confidence_score=session_data.get('recall_confidence_score'),
            hesitation_count=session_data.get('hesitation_count', 0),
            
            # Visual metrics
            visual_cues_presented=session_data.get('visual_cues_presented', 0),
            visual_cues_noticed=session_data.get('visual_cues_noticed', 0),
            visual_engagement_duration_seconds=session_data.get('visual_engagement_duration_seconds'),
            avg_time_per_image_seconds=session_data.get('avg_time_per_image_seconds'),
            images_viewed=session_data.get('images_viewed', []),
            favorite_images=session_data.get('favorite_images', []),
            images_sparked_memory=session_data.get('images_sparked_memory', []),
            eye_contact_maintained=session_data.get('eye_contact_maintained'),
            visual_recognition_score=session_data.get('visual_recognition_score'),
            pointed_at_images=session_data.get('pointed_at_images', False),
            asked_about_images=session_data.get('asked_about_images', False),
            
            # Emotional metrics
            primary_emotion=session_data.get('primary_emotion'),
            emotional_valence=session_data.get('emotional_valence'),
            emotional_arousal=session_data.get('emotional_arousal'),
            smiled_count=session_data.get('smiled_count', 0),
            laughed_count=session_data.get('laughed_count', 0),
            cried_or_teared_up=session_data.get('cried_or_teared_up', False),
            showed_frustration=session_data.get('showed_frustration', False),
            showed_agitation=session_data.get('showed_agitation', False),
            showed_contentment=session_data.get('showed_contentment', False),
            
            # Physical metrics
            physical_gestures=session_data.get('physical_gestures', []),
            reached_out_to_touch=session_data.get('reached_out_to_touch', False),
            leaned_forward=session_data.get('leaned_forward', False),
            fidgeting_noted=session_data.get('fidgeting_noted', False),
            restlessness_score=session_data.get('restlessness_score'),
            
            # Overall scores
            overall_engagement_score=overall_score,
            attention_span_seconds=session_data.get('attention_span_seconds'),
            distraction_count=session_data.get('distraction_count', 0),
            quality_of_interaction=session_data.get('quality_of_interaction'),
            depth_of_conversation=session_data.get('depth_of_conversation'),
            reciprocity_score=session_data.get('reciprocity_score'),
            
            # Context
            time_of_day=session_data.get('time_of_day'),
            session_duration_seconds=session_data.get('session_duration_seconds'),
            interruptions_count=session_data.get('interruptions_count', 0),
            caregiver_present=session_data.get('caregiver_present', False),
            location=session_data.get('location'),
            background_noise_level=session_data.get('background_noise_level'),
            
            # Content
            content_type_used=session_data.get('content_type_used'),
            content_id=session_data.get('content_id'),
            content_effectiveness_score=session_data.get('content_effectiveness_score'),
            
            # Trends
            compared_to_baseline=session_data.get('compared_to_baseline'),
            trend_direction=session_data.get('trend_direction'),
            
            # Notes
            notes=session_data.get('notes'),
            ai_assessment=session_data.get('ai_assessment')
        )
        
        self.db.add(metric)
        self.db.commit()
        self.db.refresh(metric)
        
        # Update aggregated summaries
        self._update_summaries(patient_id, metric)
        
        return metric
    
    def _calculate_overall_engagement(self, data: Dict) -> Decimal:
        """Calculate overall engagement score from component metrics"""
        
        scores = []
        weights = []
        
        # Verbal engagement (30% weight)
        if data.get('verbal_response_count', 0) > 0:
            verbal_score = min(1.0, data.get('verbal_response_count', 0) / 5.0)
            if data.get('verbal_clarity_score'):
                verbal_score = (verbal_score + float(data['verbal_clarity_score'])) / 2
            scores.append(verbal_score)
            weights.append(0.30)
        
        # Memory engagement (25% weight)
        if data.get('memory_prompts_given', 0) > 0:
            memory_score = data.get('accurate_recalls', 0) / data.get('memory_prompts_given', 1)
            if data.get('recall_confidence_score'):
                memory_score = (memory_score + float(data['recall_confidence_score'])) / 2
            scores.append(memory_score)
            weights.append(0.25)
        
        # Visual engagement (20% weight)
        if data.get('visual_cues_presented', 0) > 0:
            visual_score = data.get('visual_cues_noticed', 0) / data.get('visual_cues_presented', 1)
            if data.get('visual_recognition_score'):
                visual_score = (visual_score + float(data['visual_recognition_score'])) / 2
            scores.append(visual_score)
            weights.append(0.20)
        
        # Emotional positivity (15% weight)
        if data.get('emotional_valence') is not None:
            # Convert -1 to 1 scale to 0 to 1 scale
            emotion_score = (float(data['emotional_valence']) + 1.0) / 2.0
            scores.append(emotion_score)
            weights.append(0.15)
        
        # Attention span (10% weight)
        if data.get('attention_span_seconds'):
            # Normalize to 0-1 (assuming 300 seconds = perfect)
            attention_score = min(1.0, data['attention_span_seconds'] / 300.0)
            scores.append(attention_score)
            weights.append(0.10)
        
        if not scores:
            return Decimal('0.50')  # Default neutral score
        
        # Weighted average
        weighted_sum = sum(s * w for s, w in zip(scores, weights))
        total_weight = sum(weights)
        
        return Decimal(str(round(weighted_sum / total_weight, 2)))
    
    def _update_summaries(self, patient_id: int, metric: EngagementMetric):
        """Update aggregated summaries after recording new metric"""
        
        # Update daily summary
        self._update_summary(patient_id, 'daily', metric)
        
        # Update weekly summary
        self._update_summary(patient_id, 'weekly', metric)
        
        # Update monthly summary
        self._update_summary(patient_id, 'monthly', metric)
    
    def _update_summary(self, patient_id: int, period_type: str, metric: EngagementMetric):
        """Update or create summary for a specific period"""
        
        period_start, period_end = self._get_period_bounds(metric.recorded_at, period_type)
        
        # Find or create summary
        summary = self.db.query(EngagementSummary).filter(
            and_(
                EngagementSummary.patient_id == patient_id,
                EngagementSummary.period_type == period_type,
                EngagementSummary.period_start == period_start
            )
        ).first()
        
        if not summary:
            summary = EngagementSummary(
                patient_id=patient_id,
                period_type=period_type,
                period_start=period_start,
                period_end=period_end
            )
            self.db.add(summary)
        
        # Aggregate all metrics in this period
        metrics = self.db.query(EngagementMetric).filter(
            and_(
                EngagementMetric.patient_id == patient_id,
                EngagementMetric.recorded_at >= period_start,
                EngagementMetric.recorded_at < period_end
            )
        ).all()
        
        # Calculate aggregates
        summary.total_sessions = len(metrics)
        summary.total_duration_minutes = sum(m.session_duration_seconds or 0 for m in metrics) // 60
        summary.avg_session_duration_minutes = summary.total_duration_minutes / len(metrics) if metrics else 0
        
        # Verbal aggregates
        summary.avg_verbal_response_count = sum(m.verbal_response_count for m in metrics) / len(metrics) if metrics else 0
        summary.avg_words_per_session = sum(m.total_words_spoken for m in metrics) / len(metrics) if metrics else 0
        summary.avg_verbal_clarity = self._avg_decimal([m.verbal_clarity_score for m in metrics if m.verbal_clarity_score])
        summary.conversation_initiation_rate = Decimal(str(sum(1 for m in metrics if m.initiated_conversation) / len(metrics))) if metrics else Decimal('0')
        
        # Memory aggregates
        total_accurate = sum(m.accurate_recalls for m in metrics)
        total_partial = sum(m.partial_recalls for m in metrics)
        total_none = sum(m.no_recalls for m in metrics)
        total_attempts = sum(m.memory_responses_attempted for m in metrics)
        
        summary.total_memories_attempted = total_attempts
        summary.total_accurate_memories = total_accurate
        summary.accurate_recall_rate = Decimal(str(total_accurate / total_attempts)) if total_attempts > 0 else Decimal('0')
        summary.partial_recall_rate = Decimal(str(total_partial / total_attempts)) if total_attempts > 0 else Decimal('0')
        summary.no_recall_rate = Decimal(str(total_none / total_attempts)) if total_attempts > 0 else Decimal('0')
        summary.avg_memory_accuracy_score = summary.accurate_recall_rate
        
        # Visual aggregates
        summary.avg_visual_engagement_score = self._avg_decimal([m.visual_recognition_score for m in metrics if m.visual_recognition_score])
        summary.avg_images_per_session = sum(m.visual_cues_presented for m in metrics) / len(metrics) if metrics else 0
        summary.avg_time_per_image = sum(m.avg_time_per_image_seconds or 0 for m in metrics) / len([m for m in metrics if m.avg_time_per_image_seconds]) if metrics else 0
        summary.visual_recognition_rate = self._avg_decimal([m.visual_recognition_score for m in metrics if m.visual_recognition_score])
        
        # Emotional aggregates
        summary.avg_emotional_valence = self._avg_decimal([m.emotional_valence for m in metrics if m.emotional_valence])
        positive_emotions = sum(1 for m in metrics if m.emotional_valence and m.emotional_valence > 0)
        summary.positive_emotion_rate = Decimal(str(positive_emotions / len(metrics))) if metrics else Decimal('0')
        summary.smile_frequency = sum(m.smiled_count for m in metrics) / len(metrics) if metrics else 0
        summary.distress_incidents = sum(1 for m in metrics if m.showed_agitation or m.showed_frustration)
        
        # Overall aggregates
        summary.avg_overall_engagement = self._avg_decimal([m.overall_engagement_score for m in metrics])
        summary.avg_interaction_quality = self._avg_decimal([m.quality_of_interaction for m in metrics if m.quality_of_interaction])
        summary.avg_attention_span_seconds = sum(m.attention_span_seconds or 0 for m in metrics) / len(metrics) if metrics else 0
        
        # Trends
        previous_summary = self._get_previous_summary(patient_id, period_type, period_start)
        if previous_summary and previous_summary.avg_overall_engagement:
            change = float(summary.avg_overall_engagement - previous_summary.avg_overall_engagement)
            summary.trend_vs_previous_period = Decimal(str(round(change * 100, 2)))
            
            if change > 0.05:
                summary.trend_direction = "improving"
            elif change < -0.05:
                summary.trend_direction = "declining"
            else:
                summary.trend_direction = "stable"
        
        # Best performance analysis
        summary.best_time_of_day = self._get_best_time_of_day(metrics)
        summary.most_effective_content_type = self._get_most_effective_content(metrics)
        
        summary.updated_at = datetime.utcnow()
        
        self.db.commit()
    
    # ========================================================================
    # ANALYTICS RETRIEVAL
    # ========================================================================
    
    def get_engagement_overview(self, patient_id: int, days: int = 30) -> Dict:
        """Get engagement overview for dashboard"""
        
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        metrics = self.db.query(EngagementMetric).filter(
            and_(
                EngagementMetric.patient_id == patient_id,
                EngagementMetric.recorded_at >= cutoff
            )
        ).all()
        
        if not metrics:
            return self._empty_overview()
        
        return {
            "period_days": days,
            "total_sessions": len(metrics),
            "avg_engagement_score": float(sum(m.overall_engagement_score for m in metrics) / len(metrics)),
            "trend": self._calculate_trend(metrics),
            "verbal_metrics": self._aggregate_verbal(metrics),
            "memory_metrics": self._aggregate_memory(metrics),
            "visual_metrics": self._aggregate_visual(metrics),
            "emotional_metrics": self._aggregate_emotional(metrics),
            "best_times": self._find_best_times(metrics),
            "recent_highlights": self._get_recent_highlights(metrics[:5])
        }
    
    def get_detailed_metrics(self, patient_id: int, metric_id: int) -> Dict:
        """Get details for a specific engagement metric"""
        
        metric = self.db.query(EngagementMetric).filter(
            and_(
                EngagementMetric.id == metric_id,
                EngagementMetric.patient_id == patient_id
            )
        ).first()
        
        if not metric:
            return None
        
        return {
            "id": metric.id,
            "recorded_at": metric.recorded_at.isoformat(),
            "overall_score": float(metric.overall_engagement_score),
            "verbal": {
                "response_count": metric.verbal_response_count,
                "total_words": metric.total_words_spoken,
                "avg_words": metric.avg_response_length_words,
                "clarity_score": float(metric.verbal_clarity_score) if metric.verbal_clarity_score else None,
                "initiated": metric.initiated_conversation
            },
            "memory": {
                "prompts_given": metric.memory_prompts_given,
                "attempts": metric.memory_responses_attempted,
                "accurate": metric.accurate_recalls,
                "partial": metric.partial_recalls,
                "no_recall": metric.no_recalls,
                "confabulations": metric.confabulations,
                "names_recalled": metric.memory_names_recalled,
                "events_recalled": metric.memory_events_recalled,
                "confidence": float(metric.recall_confidence_score) if metric.recall_confidence_score else None
            },
            "visual": {
                "cues_presented": metric.visual_cues_presented,
                "cues_noticed": metric.visual_cues_noticed,
                "engagement_duration": metric.visual_engagement_duration_seconds,
                "images_viewed": metric.images_viewed,
                "favorite_images": metric.favorite_images,
                "recognition_score": float(metric.visual_recognition_score) if metric.visual_recognition_score else None
            },
            "emotional": {
                "primary_emotion": metric.primary_emotion,
                "valence": float(metric.emotional_valence) if metric.emotional_valence else None,
                "smiled": metric.smiled_count,
                "laughed": metric.laughed_count,
                "showed_contentment": metric.showed_contentment
            },
            "context": {
                "time_of_day": metric.time_of_day,
                "duration_seconds": metric.session_duration_seconds,
                "location": metric.location,
                "caregiver_present": metric.caregiver_present
            }
        }
    
    def get_trend_data(self, patient_id: int, metric_type: str, days: int = 30) -> List[Dict]:
        """Get trend data for charts"""
        
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        metrics = self.db.query(EngagementMetric).filter(
            and_(
                EngagementMetric.patient_id == patient_id,
                EngagementMetric.recorded_at >= cutoff
            )
        ).order_by(EngagementMetric.recorded_at).all()
        
        data_points = []
        for metric in metrics:
            point = {
                "timestamp": metric.recorded_at.isoformat(),
                "date": metric.recorded_at.strftime("%Y-%m-%d")
            }
            
            if metric_type == "overall":
                point["value"] = float(metric.overall_engagement_score)
            elif metric_type == "verbal":
                point["value"] = metric.verbal_response_count
            elif metric_type == "memory":
                point["value"] = metric.accurate_recalls
            elif metric_type == "visual":
                point["value"] = float(metric.visual_recognition_score) if metric.visual_recognition_score else 0
            elif metric_type == "emotional":
                point["value"] = float(metric.emotional_valence) if metric.emotional_valence else 0
            
            data_points.append(point)
        
        return data_points
    
    # ========================================================================
    # HELPER METHODS
    # ========================================================================
    
    def _get_period_bounds(self, date: datetime, period_type: str) -> Tuple[datetime, datetime]:
        """Get start and end bounds for a period"""
        
        if period_type == "daily":
            start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=1)
        elif period_type == "weekly":
            start = date - timedelta(days=date.weekday())
            start = start.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=7)
        elif period_type == "monthly":
            start = date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if start.month == 12:
                end = start.replace(year=start.year + 1, month=1)
            else:
                end = start.replace(month=start.month + 1)
        
        return start, end
    
    def _avg_decimal(self, values: List) -> Decimal:
        """Calculate average of decimal values"""
        valid = [v for v in values if v is not None]
        if not valid:
            return Decimal('0')
        return Decimal(str(round(sum(float(v) for v in valid) / len(valid), 2)))
    
    def _get_previous_summary(self, patient_id: int, period_type: str, current_start: datetime):
        """Get previous period summary"""
        
        if period_type == "daily":
            prev_start = current_start - timedelta(days=1)
        elif period_type == "weekly":
            prev_start = current_start - timedelta(days=7)
        elif period_type == "monthly":
            prev_start = current_start - timedelta(days=30)
        
        return self.db.query(EngagementSummary).filter(
            and_(
                EngagementSummary.patient_id == patient_id,
                EngagementSummary.period_type == period_type,
                EngagementSummary.period_start == prev_start
            )
        ).first()
    
    def _get_best_time_of_day(self, metrics: List[EngagementMetric]) -> str:
        """Find best time of day for engagement"""
        
        time_scores = {}
        for metric in metrics:
            if metric.time_of_day:
                if metric.time_of_day not in time_scores:
                    time_scores[metric.time_of_day] = []
                time_scores[metric.time_of_day].append(float(metric.overall_engagement_score))
        
        if not time_scores:
            return "morning"
        
        avg_scores = {time: sum(scores) / len(scores) for time, scores in time_scores.items()}
        return max(avg_scores, key=avg_scores.get)
    
    def _get_most_effective_content(self, metrics: List[EngagementMetric]) -> str:
        """Find most effective content type"""
        
        content_scores = {}
        for metric in metrics:
            if metric.content_type_used:
                if metric.content_type_used not in content_scores:
                    content_scores[metric.content_type_used] = []
                content_scores[metric.content_type_used].append(float(metric.overall_engagement_score))
        
        if not content_scores:
            return "conversation"
        
        avg_scores = {content: sum(scores) / len(scores) for content, scores in content_scores.items()}
        return max(avg_scores, key=avg_scores.get)
    
    def _aggregate_verbal(self, metrics: List[EngagementMetric]) -> Dict:
        """Aggregate verbal metrics"""
        return {
            "avg_responses_per_session": sum(m.verbal_response_count for m in metrics) / len(metrics),
            "avg_words_per_session": sum(m.total_words_spoken for m in metrics) / len(metrics),
            "conversation_initiation_rate": sum(1 for m in metrics if m.initiated_conversation) / len(metrics),
            "avg_clarity": float(self._avg_decimal([m.verbal_clarity_score for m in metrics if m.verbal_clarity_score]))
        }
    
    def _aggregate_memory(self, metrics: List[EngagementMetric]) -> Dict:
        """Aggregate memory metrics"""
        total_attempts = sum(m.memory_responses_attempted for m in metrics)
        total_accurate = sum(m.accurate_recalls for m in metrics)
        
        return {
            "total_prompts": sum(m.memory_prompts_given for m in metrics),
            "total_attempts": total_attempts,
            "accuracy_rate": total_accurate / total_attempts if total_attempts > 0 else 0,
            "avg_confidence": float(self._avg_decimal([m.recall_confidence_score for m in metrics if m.recall_confidence_score]))
        }
    
    def _aggregate_visual(self, metrics: List[EngagementMetric]) -> Dict:
        """Aggregate visual metrics"""
        return {
            "avg_images_per_session": sum(m.visual_cues_presented for m in metrics) / len(metrics),
            "recognition_rate": float(self._avg_decimal([m.visual_recognition_score for m in metrics if m.visual_recognition_score])),
            "avg_engagement_duration": sum(m.visual_engagement_duration_seconds or 0 for m in metrics) / len(metrics)
        }
    
    def _aggregate_emotional(self, metrics: List[EngagementMetric]) -> Dict:
        """Aggregate emotional metrics"""
        return {
            "avg_valence": float(self._avg_decimal([m.emotional_valence for m in metrics if m.emotional_valence])),
            "positive_rate": sum(1 for m in metrics if m.emotional_valence and m.emotional_valence > 0) / len(metrics),
            "avg_smiles_per_session": sum(m.smiled_count for m in metrics) / len(metrics),
            "distress_incidents": sum(1 for m in metrics if m.showed_agitation or m.showed_frustration)
        }
    
    def _calculate_trend(self, metrics: List[EngagementMetric]) -> str:
        """Calculate overall trend"""
        if len(metrics) < 2:
            return "stable"
        
        # Compare first half to second half
        midpoint = len(metrics) // 2
        first_half_avg = sum(float(m.overall_engagement_score) for m in metrics[:midpoint]) / midpoint
        second_half_avg = sum(float(m.overall_engagement_score) for m in metrics[midpoint:]) / (len(metrics) - midpoint)
        
        change = second_half_avg - first_half_avg
        
        if change > 0.05:
            return "improving"
        elif change < -0.05:
            return "declining"
        else:
            return "stable"
    
    def _find_best_times(self, metrics: List[EngagementMetric]) -> Dict:
        """Find best times for engagement"""
        return {
            "time_of_day": self._get_best_time_of_day(metrics),
            "content_type": self._get_most_effective_content(metrics)
        }
    
    def _get_recent_highlights(self, metrics: List[EngagementMetric]) -> List[str]:
        """Get recent positive highlights"""
        highlights = []
        
        for metric in metrics:
            if metric.smiled_count > 0:
                highlights.append(f"Smiled {metric.smiled_count} times during session")
            if metric.accurate_recalls > 0:
                highlights.append(f"Accurately recalled {metric.accurate_recalls} memories")
            if metric.initiated_conversation:
                highlights.append("Initiated conversation independently")
        
        return highlights[:5]
    
    def _empty_overview(self) -> Dict:
        """Return empty overview when no data"""
        return {
            "period_days": 0,
            "total_sessions": 0,
            "avg_engagement_score": 0,
            "trend": "stable",
            "verbal_metrics": {},
            "memory_metrics": {},
            "visual_metrics": {},
            "emotional_metrics": {},
            "best_times": {},
            "recent_highlights": []
        }
