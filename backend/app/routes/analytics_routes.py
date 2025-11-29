"""
Analytics API Routes
Endpoints for engagement tracking and analytics
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from ..database import get_db
from ..services.engagement_analytics import EngagementAnalytics
from ..models import Patient, EngagementMetric

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class EngagementRecordRequest(BaseModel):
    """Request to record engagement metrics"""
    patient_id: int
    conversation_id: Optional[int] = None
    ritual_session_id: Optional[int] = None
    storyline_session_id: Optional[int] = None
    
    # Verbal metrics
    verbal_response_count: int = 0
    avg_response_length_words: Optional[int] = None
    total_words_spoken: int = 0
    response_time_seconds: Optional[float] = None
    verbal_clarity_score: Optional[float] = None
    initiated_conversation: bool = False
    
    # Memory metrics
    memory_prompts_given: int = 0
    memory_responses_attempted: int = 0
    memory_accuracy: Optional[str] = None
    accurate_recalls: int = 0
    partial_recalls: int = 0
    confabulations: int = 0
    no_recalls: int = 0
    memory_names_recalled: List[str] = []
    memory_events_recalled: List[str] = []
    memory_dates_recalled: List[str] = []
    memory_places_recalled: List[str] = []
    recall_confidence_score: Optional[float] = None
    hesitation_count: int = 0
    
    # Visual metrics
    visual_cues_presented: int = 0
    visual_cues_noticed: int = 0
    visual_engagement_duration_seconds: Optional[float] = None
    avg_time_per_image_seconds: Optional[float] = None
    images_viewed: List[dict] = []
    favorite_images: List[dict] = []
    images_sparked_memory: List[dict] = []
    eye_contact_maintained: Optional[bool] = None
    visual_recognition_score: Optional[float] = None
    pointed_at_images: bool = False
    asked_about_images: bool = False
    
    # Emotional metrics
    primary_emotion: Optional[str] = None
    emotional_valence: Optional[float] = None
    emotional_arousal: Optional[float] = None
    smiled_count: int = 0
    laughed_count: int = 0
    cried_or_teared_up: bool = False
    showed_frustration: bool = False
    showed_agitation: bool = False
    showed_contentment: bool = False
    
    # Physical metrics
    physical_gestures: List[str] = []
    reached_out_to_touch: bool = False
    leaned_forward: bool = False
    fidgeting_noted: bool = False
    restlessness_score: Optional[float] = None
    
    # Overall scores
    attention_span_seconds: Optional[int] = None
    distraction_count: int = 0
    quality_of_interaction: Optional[float] = None
    depth_of_conversation: Optional[float] = None
    reciprocity_score: Optional[float] = None
    
    # Context
    time_of_day: Optional[str] = None
    session_duration_seconds: Optional[int] = None
    interruptions_count: int = 0
    caregiver_present: bool = False
    location: Optional[str] = None
    background_noise_level: Optional[str] = None
    
    # Content
    content_type_used: Optional[str] = None
    content_id: Optional[int] = None
    content_effectiveness_score: Optional[float] = None
    
    # Notes
    notes: Optional[str] = None
    ai_assessment: Optional[str] = None


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/engagement/record")
def record_engagement_metric(
    request: EngagementRecordRequest,
    db: Session = Depends(get_db)
):
    """
    Record detailed engagement metrics for a session
    
    Captures all engagement dimensions:
    - Verbal response
    - Memory recitation accuracy
    - Visual engagement with images
    - Emotional response
    - Physical engagement
    """
    
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == request.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Create analytics service
    analytics = EngagementAnalytics(db)
    
    # Convert request to dict
    session_data = request.dict(exclude={'patient_id', 'conversation_id', 'ritual_session_id', 'storyline_session_id'})
    
    # Record metrics
    metric = analytics.record_engagement(
        patient_id=request.patient_id,
        session_data=session_data,
        conversation_id=request.conversation_id,
        ritual_session_id=request.ritual_session_id,
        storyline_session_id=request.storyline_session_id
    )
    
    return {
        "success": True,
        "metric_id": metric.id,
        "overall_engagement_score": float(metric.overall_engagement_score),
        "message": "Engagement metrics recorded successfully"
    }


@router.get("/engagement/overview/{patient_id}")
def get_engagement_overview(
    patient_id: int,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """
    Get engagement overview for dashboard
    
    Returns aggregated metrics for the specified time period
    """
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    analytics = EngagementAnalytics(db)
    overview = analytics.get_engagement_overview(patient_id, days)
    
    return overview


@router.get("/engagement/metrics/{patient_id}")
def list_engagement_metrics(
    patient_id: int,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    List engagement metrics for a patient
    
    Returns paginated list of recorded metrics
    """
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    metrics = db.query(EngagementMetric).filter(
        EngagementMetric.patient_id == patient_id
    ).order_by(
        EngagementMetric.recorded_at.desc()
    ).limit(limit).offset(offset).all()
    
    total = db.query(EngagementMetric).filter(
        EngagementMetric.patient_id == patient_id
    ).count()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "metrics": [
            {
                "id": m.id,
                "recorded_at": m.recorded_at.isoformat(),
                "overall_score": float(m.overall_engagement_score),
                "verbal_responses": m.verbal_response_count,
                "accurate_recalls": m.accurate_recalls,
                "visual_engagement": float(m.visual_recognition_score) if m.visual_recognition_score else None,
                "primary_emotion": m.primary_emotion,
                "session_type": "ritual" if m.ritual_session_id else "storyline" if m.storyline_session_id else "conversation"
            }
            for m in metrics
        ]
    }


@router.get("/engagement/metric/{metric_id}")
def get_engagement_metric_detail(
    metric_id: int,
    patient_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a specific engagement metric
    """
    
    analytics = EngagementAnalytics(db)
    detail = analytics.get_detailed_metrics(patient_id, metric_id)
    
    if not detail:
        raise HTTPException(status_code=404, detail="Metric not found")
    
    return detail


@router.get("/engagement/trends/{patient_id}")
def get_engagement_trends(
    patient_id: int,
    metric_type: str = Query("overall", regex="^(overall|verbal|memory|visual|emotional)$"),
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db)
):
    """
    Get trend data for charts
    
    metric_type: overall, verbal, memory, visual, emotional
    """
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    analytics = EngagementAnalytics(db)
    trend_data = analytics.get_trend_data(patient_id, metric_type, days)
    
    return {
        "patient_id": patient_id,
        "metric_type": metric_type,
        "period_days": days,
        "data_points": trend_data
    }


@router.get("/engagement/summary/{patient_id}")
def get_engagement_summary(
    patient_id: int,
    period_type: str = Query("weekly", regex="^(daily|weekly|monthly)$"),
    limit: int = Query(12, ge=1, le=52),
    db: Session = Depends(get_db)
):
    """
    Get pre-calculated engagement summaries
    
    period_type: daily, weekly, monthly
    """
    
    from ..models import EngagementSummary
    from sqlalchemy import and_
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    summaries = db.query(EngagementSummary).filter(
        and_(
            EngagementSummary.patient_id == patient_id,
            EngagementSummary.period_type == period_type
        )
    ).order_by(
        EngagementSummary.period_start.desc()
    ).limit(limit).all()
    
    return {
        "patient_id": patient_id,
        "period_type": period_type,
        "summaries": [
            {
                "period_start": s.period_start.isoformat(),
                "period_end": s.period_end.isoformat(),
                "total_sessions": s.total_sessions,
                "avg_engagement": float(s.avg_overall_engagement),
                "avg_verbal_responses": s.avg_verbal_response_count,
                "memory_accuracy": float(s.accurate_recall_rate) if s.accurate_recall_rate else 0,
                "visual_engagement": float(s.avg_visual_engagement_score) if s.avg_visual_engagement_score else 0,
                "emotional_valence": float(s.avg_emotional_valence) if s.avg_emotional_valence else 0,
                "trend": s.trend_direction,
                "trend_change_percent": float(s.trend_vs_previous_period) if s.trend_vs_previous_period else 0
            }
            for s in summaries
        ]
    }


@router.get("/engagement/comparison/{patient_id}")
def compare_engagement_metrics(
    patient_id: int,
    metric_type: str = Query("overall"),
    days: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db)
):
    """
    Compare current period to previous period
    """
    
    from datetime import datetime, timedelta
    from sqlalchemy import and_
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    now = datetime.utcnow()
    current_start = now - timedelta(days=days)
    previous_start = current_start - timedelta(days=days)
    
    # Current period metrics
    current_metrics = db.query(EngagementMetric).filter(
        and_(
            EngagementMetric.patient_id == patient_id,
            EngagementMetric.recorded_at >= current_start,
            EngagementMetric.recorded_at < now
        )
    ).all()
    
    # Previous period metrics
    previous_metrics = db.query(EngagementMetric).filter(
        and_(
            EngagementMetric.patient_id == patient_id,
            EngagementMetric.recorded_at >= previous_start,
            EngagementMetric.recorded_at < current_start
        )
    ).all()
    
    def calculate_avg(metrics):
        if not metrics:
            return 0
        scores = [float(m.overall_engagement_score) for m in metrics]
        return sum(scores) / len(scores)
    
    current_avg = calculate_avg(current_metrics)
    previous_avg = calculate_avg(previous_metrics)
    change_percent = ((current_avg - previous_avg) / previous_avg * 100) if previous_avg > 0 else 0
    
    return {
        "patient_id": patient_id,
        "metric_type": metric_type,
        "current_period": {
            "start": current_start.isoformat(),
            "end": now.isoformat(),
            "sessions": len(current_metrics),
            "avg_score": round(current_avg, 2)
        },
        "previous_period": {
            "start": previous_start.isoformat(),
            "end": current_start.isoformat(),
            "sessions": len(previous_metrics),
            "avg_score": round(previous_avg, 2)
        },
        "change_percent": round(change_percent, 2),
        "trend": "improving" if change_percent > 5 else "declining" if change_percent < -5 else "stable"
    }


@router.get("/engagement/best-times/{patient_id}")
def get_best_engagement_times(
    patient_id: int,
    days: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db)
):
    """
    Analyze best times and conditions for engagement
    """
    
    from datetime import datetime, timedelta
    from sqlalchemy import and_
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    cutoff = datetime.utcnow() - timedelta(days=days)
    
    metrics = db.query(EngagementMetric).filter(
        and_(
            EngagementMetric.patient_id == patient_id,
            EngagementMetric.recorded_at >= cutoff
        )
    ).all()
    
    # Analyze by time of day
    time_analysis = {}
    for metric in metrics:
        if metric.time_of_day:
            if metric.time_of_day not in time_analysis:
                time_analysis[metric.time_of_day] = []
            time_analysis[metric.time_of_day].append(float(metric.overall_engagement_score))
    
    time_averages = {
        time: sum(scores) / len(scores)
        for time, scores in time_analysis.items()
    }
    
    # Analyze by content type
    content_analysis = {}
    for metric in metrics:
        if metric.content_type_used:
            if metric.content_type_used not in content_analysis:
                content_analysis[metric.content_type_used] = []
            content_analysis[metric.content_type_used].append(float(metric.overall_engagement_score))
    
    content_averages = {
        content: sum(scores) / len(scores)
        for content, scores in content_analysis.items()
    }
    
    # Analyze with/without caregiver
    with_caregiver = [float(m.overall_engagement_score) for m in metrics if m.caregiver_present]
    without_caregiver = [float(m.overall_engagement_score) for m in metrics if not m.caregiver_present]
    
    return {
        "patient_id": patient_id,
        "analysis_period_days": days,
        "best_time_of_day": max(time_averages, key=time_averages.get) if time_averages else None,
        "time_of_day_scores": {k: round(v, 2) for k, v in time_averages.items()},
        "best_content_type": max(content_averages, key=content_averages.get) if content_averages else None,
        "content_type_scores": {k: round(v, 2) for k, v in content_averages.items()},
        "caregiver_impact": {
            "with_caregiver_avg": round(sum(with_caregiver) / len(with_caregiver), 2) if with_caregiver else 0,
            "without_caregiver_avg": round(sum(without_caregiver) / len(without_caregiver), 2) if without_caregiver else 0,
            "sessions_with": len(with_caregiver),
            "sessions_without": len(without_caregiver)
        }
    }
