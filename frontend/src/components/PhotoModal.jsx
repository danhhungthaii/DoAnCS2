import { useState, useEffect } from 'react';
import { 
  CloseOutlined, 
  LeftOutlined, 
  RightOutlined, 
  CheckOutlined, 
  CloseCircleOutlined 
} from '@ant-design/icons';
import { getPhotoUrl } from '../services/verificationService';
import './PhotoModal.css';

export default function PhotoModal({ 
  attendance, 
  onClose, 
  onApprove, 
  onReject,
  onNext,
  onPrev,
  hasNext,
  hasPrev
}) {
  const [note, setNote] = useState('');
  const [pointsBreakdown, setPointsBreakdown] = useState(null);

  useEffect(() => {
    // Calculate points breakdown
    const breakdown = calculatePoints(attendance);
    setPointsBreakdown(breakdown);

    // Keyboard shortcuts
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'a' || e.key === 'A') handleApprove();
      if (e.key === 'r' || e.key === 'R') handleReject();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [attendance, hasNext, hasPrev]);

  const calculatePoints = (att) => {
    const event = att.event;
    const basePoints = event?.points || 5;
    
    let earlyBonus = 0;
    let gpsBonus = 0;
    let earlyReason = '';
    let gpsReason = '';

    // Calculate early bonus (±10 minutes)
    if (att.checkInTime && event?.dateTime) {
      const checkInTime = new Date(att.checkInTime);
      const eventTime = new Date(event.dateTime);
      const diffMinutes = Math.abs((checkInTime - eventTime) / 60000);
      
      if (diffMinutes <= 10) {
        earlyBonus = 1;
        earlyReason = `Check-in trong khoảng ±10 phút (${diffMinutes.toFixed(0)} phút)`;
      } else {
        earlyReason = `Check-in muộn ${diffMinutes.toFixed(0)} phút`;
      }
    }

    // Calculate GPS bonus (≤ 50% radius)
    if (att.distance !== undefined && event?.checkInRadius) {
      const threshold = event.checkInRadius / 2;
      if (att.distance <= threshold) {
        gpsBonus = 0.5;
        gpsReason = `Trong ${threshold}m (${att.distance.toFixed(1)}m)`;
      } else {
        gpsReason = `Ngoài ${threshold}m (${att.distance.toFixed(1)}m)`;
      }
    }

    const total = basePoints + earlyBonus + gpsBonus;

    return {
      base: basePoints,
      earlyBonus,
      gpsBonus,
      total,
      earlyReason,
      gpsReason
    };
  };

  const handleApprove = () => {
    onApprove(note || 'Ảnh rõ ràng, phê duyệt');
  };

  const handleReject = () => {
    if (!note.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    onReject();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const { student, event } = attendance;
  const photoUrl = getPhotoUrl(attendance.evidencePhoto);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            🖼️ Xác nhận điểm danh - {student.studentCode} - {student.fullName}
          </h2>
          <button onClick={onClose} className="btn-close">
            <CloseOutlined style={{ fontSize: '24px' }} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            {/* Left: Photo */}
            <div className="photo-section">
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt="Evidence" 
                  className="full-photo"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="48">❌ Lỗi tải ảnh</text></svg>';
                  }}
                />
              ) : (
                <div className="no-photo-placeholder">
                  <p>📷 Không có ảnh</p>
                  <p className="text-small">Auto-approve sau khi kiểm tra thông tin</p>
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className="details-section">
              <h3>📊 Thông tin chi tiết</h3>
              
              <div className="detail-group">
                <label>Sinh viên:</label>
                <div className="detail-value">
                  <div>{student.studentCode}</div>
                  <div className="text-bold">{student.fullName}</div>
                  <div className="text-muted">{student.class}</div>
                </div>
              </div>

              <div className="detail-group">
                <label>Sự kiện:</label>
                <div className="detail-value">
                  <div className="text-bold">{event?.title}</div>
                  <div className="text-muted">
                    {event?.dateTime && formatDateTime(event.dateTime)}
                  </div>
                </div>
              </div>

              <div className="detail-group">
                <label>⏰ Thời gian:</label>
                <div className="detail-value">
                  <div>Check-in: {formatDateTime(attendance.checkInTime)}</div>
                  {pointsBreakdown && (
                    <div className={pointsBreakdown.earlyBonus > 0 ? 'text-success' : 'text-danger'}>
                      {pointsBreakdown.earlyBonus > 0 ? '✅' : '❌'} {pointsBreakdown.earlyReason}
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-group">
                <label>📍 Vị trí GPS:</label>
                <div className="detail-value">
                  <div>Khoảng cách: {attendance.distance?.toFixed(1)}m</div>
                  <div>Bán kính cho phép: {event?.checkInRadius || 100}m</div>
                  {pointsBreakdown && (
                    <div className={pointsBreakdown.gpsBonus > 0 ? 'text-success' : 'text-warning'}>
                      {pointsBreakdown.gpsBonus > 0 ? '✅' : '⚠️'} {pointsBreakdown.gpsReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Points Preview */}
              {pointsBreakdown && (
                <div className="points-preview">
                  <h4>🎯 Điểm dự kiến:</h4>
                  <div className="points-breakdown">
                    <div className="points-row">
                      <span>Base points:</span>
                      <span className="points-value">{pointsBreakdown.base}</span>
                    </div>
                    <div className="points-row">
                      <span>Early bonus:</span>
                      <span className={pointsBreakdown.earlyBonus > 0 ? 'points-value text-success' : 'points-value text-muted'}>
                        {pointsBreakdown.earlyBonus > 0 ? '+' : ''}{pointsBreakdown.earlyBonus}
                      </span>
                    </div>
                    <div className="points-row">
                      <span>GPS bonus:</span>
                      <span className={pointsBreakdown.gpsBonus > 0 ? 'points-value text-success' : 'points-value text-muted'}>
                        {pointsBreakdown.gpsBonus > 0 ? '+' : ''}{pointsBreakdown.gpsBonus}
                      </span>
                    </div>
                    <div className="points-row points-total">
                      <span>📊 Tổng:</span>
                      <span className="points-value-total">{pointsBreakdown.total} điểm</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Note Field */}
              <div className="detail-group">
                <label htmlFor="note">📝 Ghi chú:</label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập ghi chú (tuỳ chọn cho phê duyệt, bắt buộc cho từ chối)"
                  rows={3}
                  className="note-textarea"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-left">
            <button 
              onClick={onPrev} 
              disabled={!hasPrev}
              className="btn-secondary"
            >
              <LeftOutlined style={{ fontSize: '16px' }} />
              Trước
            </button>
            <button 
              onClick={onNext} 
              disabled={!hasNext}
              className="btn-secondary"
            >
              Kế tiếp
              <RightOutlined style={{ fontSize: '16px' }} />
            </button>
          </div>

          <div className="footer-right">
            <button 
              onClick={handleReject}
              className="btn-danger"
            >
              <CloseCircleOutlined style={{ fontSize: '16px' }} />
              Từ chối (R)
            </button>
            <button 
              onClick={handleApprove}
              className="btn-success"
            >
              <CheckOutlined style={{ fontSize: '16px' }} />
              Phê duyệt (A)
            </button>
          </div>
        </div>

        <div className="modal-shortcuts">
          <small>
            💡 Phím tắt: <kbd>A</kbd> Phê duyệt | <kbd>R</kbd> Từ chối | 
            <kbd>←</kbd> Trước | <kbd>→</kbd> Kế tiếp | <kbd>Esc</kbd> Đóng
          </small>
        </div>
      </div>
    </div>
  );
}
