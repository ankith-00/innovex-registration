// ===================================
// TOASTER NOTIFICATION SYSTEM
// Usage: showToast('message', 'success' | 'error' | 'info')
// ===================================

(function () {
    // Inject container once
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'false');
        document.body.appendChild(container);
    }

    // Inject styles once
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            #toast-container {
                position: fixed;
                bottom: 1.8em;
                right: 1.8em;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 0.7em;
                pointer-events: none;
            }

            .toast {
                font-family: var(--font-jetbrains, 'JetBrains Mono', monospace);
                font-size: 0.82em;
                letter-spacing: 0.4px;
                padding: 0.85em 1.3em 0.85em 1em;
                border-radius: 6px;
                min-width: 260px;
                max-width: 380px;
                display: flex;
                align-items: flex-start;
                gap: 0.7em;
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                pointer-events: all;
                cursor: default;
                box-shadow: 0 4px 24px rgba(0,0,0,0.5);
                transform: translateX(120%);
                opacity: 0;
                transition: transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1),
                            opacity 0.28s ease;
            }

            .toast.toast--show {
                transform: translateX(0);
                opacity: 1;
            }

            .toast.toast--hide {
                transform: translateX(120%);
                opacity: 0;
                transition: transform 0.25s ease, opacity 0.2s ease;
            }

            .toast--success {
                background: rgba(10, 25, 15, 0.92);
                border: 1px solid rgba(74, 222, 128, 0.5);
                color: #4ade80;
            }

            .toast--error {
                background: rgba(25, 8, 8, 0.94);
                border: 1px solid rgba(248, 113, 113, 0.55);
                color: #f87171;
            }

            .toast--info {
                background: rgba(5, 18, 25, 0.94);
                border: 1px solid rgba(0, 243, 255, 0.35);
                color: var(--cyon-color, #00f3ff);
            }

            .toast-icon {
                font-size: 1em;
                flex-shrink: 0;
                margin-top: 0.05em;
            }

            .toast-body {
                flex: 1;
                line-height: 1.5;
                word-break: break-word;
            }

            .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 2px;
                border-radius: 0 0 6px 6px;
                animation: toast-progress-shrink var(--toast-duration, 3500ms) linear forwards;
            }

            .toast--success .toast-progress { background: #4ade80; }
            .toast--error   .toast-progress { background: #f87171; }
            .toast--info    .toast-progress { background: #00f3ff; }

            @keyframes toast-progress-shrink {
                from { width: 100%; }
                to   { width: 0%;   }
            }
        `;
        document.head.appendChild(style);
    }

    const ICONS = {
        success: '✅',
        error:   '❌',
        info:    'ℹ️'
    };

    const DURATIONS = {
        success: 3500,
        error:   5000,
        info:    3500
    };

    window.showToast = function (message, type = 'info') {
        const duration = DURATIONS[type] || 3500;

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.style.setProperty('--toast-duration', `${duration}ms`);
        toast.style.position = 'relative';
        toast.style.overflow = 'hidden';

        toast.innerHTML = `
            <span class="toast-icon">${ICONS[type] || 'ℹ️'}</span>
            <span class="toast-body">${message}</span>
            <div class="toast-progress"></div>
        `;

        container.appendChild(toast);

        // Trigger enter animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('toast--show'));
        });

        // Auto-dismiss
        const timer = setTimeout(() => dismissToast(toast), duration);

        // Click to dismiss early
        toast.addEventListener('click', () => {
            clearTimeout(timer);
            dismissToast(toast);
        });
    };

    function dismissToast(toast) {
        toast.classList.remove('toast--show');
        toast.classList.add('toast--hide');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }
})();
