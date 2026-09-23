import { Check, RefreshCw, X } from 'lucide-react';

type SlipReviewAnimationProps = {
    status: 'checking' | 'success' | 'rejected';
    message?: string;
    onRetry?: () => void;
};

export function WorksddLogoLoader() {
    return (
        <span className="worksdd-qr-loader" aria-hidden="true">
            <img src="/images/logo_jobdd_main.png" alt="" />
        </span>
    );
}

export function SlipReviewAnimation({ status, message, onRetry }: SlipReviewAnimationProps) {
    const isChecking = status === 'checking';
    const isSuccess = status === 'success';

    return (
        <div className={`slip-review-state slip-review-${status}`} role="status" aria-live="polite">
            <div className="slip-review-orbit" aria-hidden="true">
                {isChecking ? (
                    <span className="slip-review-logo-3d">
                        <img src="/images/logo_jobdd_main.png" alt="" />
                    </span>
                ) : isSuccess ? (
                    <span className="slip-success-3d">
                        <span className="slip-success-3d-face slip-success-3d-front"><Check /></span>
                        <span className="slip-success-3d-face slip-success-3d-right" />
                        <span className="slip-success-3d-face slip-success-3d-top" />
                    </span>
                ) : (
                    <span className="slip-review-result-icon"><X /></span>
                )}
            </div>

            <h3>{isChecking ? 'กำลังตรวจสอบสลิป' : isSuccess ? 'ตรวจสอบสลิปผ่านแล้ว' : 'ตรวจสอบสลิปไม่ผ่าน'}</h3>
            <p>{message || (isChecking ? 'ระบบกำลังตรวจสอบยอดเงินและข้อมูลสลิป กรุณารอสักครู่' : isSuccess ? 'ระบบกำลังเปิดใช้งานแพ็กเกจให้คุณ' : 'กรุณาตรวจสอบข้อมูลแล้วอัปโหลดสลิปใหม่อีกครั้ง')}</p>

            {isChecking && <div className="slip-review-progress" aria-hidden="true"><span /></div>}
            {!isChecking && !isSuccess && onRetry && (
                <button type="button" onClick={onRetry} className="slip-review-retry">
                    <RefreshCw className="h-4 w-4" /> เลือกสลิปใหม่
                </button>
            )}
        </div>
    );
}
