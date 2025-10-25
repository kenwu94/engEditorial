// Compiled JavaScript from TypeScript source
// Editorial page interactions with ES2020+ features

class EditorialPage {
    constructor() {
        this.masthead = document.getElementById('masthead');
        this.progressBar = document.getElementById('progressBar');
        this.toc = document.getElementById('toc');
        this.tocLinks = document.querySelectorAll('.toc-list a');
        this.shareBtn = document.getElementById('shareBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.heroImage = document.querySelector('.hero-image');
        
        this.lastScrollY = window.scrollY;
        this.ticking = false;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.sections = [];
        this.resizeTimeout = 0;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.calculateSectionPositions();
        this.setupImageLoading();
        this.setupShareButtons();
        
        this.updateProgress();
        this.updateTOCVisibility();
        
        setTimeout(() => {
            if (this.toc) {
                this.toc.classList.add('visible');
            }
        }, 500);
    }

    setupEventListeners() {
        window.addEventListener('scroll', this.handleScroll.bind(this), {
            passive: true
        });

        window.addEventListener('resize', this.handleResize.bind(this), {
            passive: true
        });

        this.tocLinks.forEach(link => {
            link.addEventListener('click', this.handleTOCClick.bind(this));
        });

        this.setupIntersectionObserver();
    }

    handleScroll() {
        if (!this.ticking) {
            requestAnimationFrame(() => {
                this.updateProgress();
                this.updateMasthead();
                this.updateActiveSection();
                this.updateTOCVisibility();
                this.lastScrollY = window.scrollY;
                this.ticking = false;
            });
            this.ticking = true;
        }
    }

    handleResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = window.setTimeout(() => {
            this.calculateSectionPositions();
            this.updateProgress();
            this.updateTOCVisibility();
        }, 250);
    }

    calculateSectionPositions() {
        this.sections = [];
        
        this.tocLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const id = href.substring(1);
                const element = document.getElementById(id);
                
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const scrollTop = window.scrollY || document.documentElement.scrollTop;
                    
                    this.sections.push({
                        id,
                        top: rect.top + scrollTop,
                        bottom: rect.bottom + scrollTop,
                        element
                    });
                }
            }
        });
    }

    updateProgress() {
        if (!this.progressBar) return;

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = Math.min((scrollTop / scrollHeight) * 100, 100);
        
        this.progressBar.style.width = `${progress}%`;
        this.progressBar.setAttribute('aria-valuenow', progress.toString());
    }

    updateMasthead() {
        if (!this.masthead) return;

        const scrollThreshold = 100;
        const isCompact = window.scrollY > scrollThreshold;
        
        if (isCompact && !this.masthead.classList.contains('compact')) {
            this.masthead.classList.add('compact');
        } else if (!isCompact && this.masthead.classList.contains('compact')) {
            this.masthead.classList.remove('compact');
        }
    }

    updateTOCVisibility() {
        if (!this.toc) return;

        const scrollThreshold = 200;
        const shouldShow = window.scrollY > scrollThreshold;
        
        if (shouldShow && !this.toc.classList.contains('visible')) {
            this.toc.classList.add('visible');
        }
    }

    updateActiveSection() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const viewportCenter = scrollTop + (window.innerHeight / 2);
        
        let activeSection = null;
        
        for (const section of this.sections) {
            if (viewportCenter >= section.top && viewportCenter <= section.bottom) {
                activeSection = section;
                break;
            }
        }
        
        if (!activeSection && this.sections.length > 0) {
            let maxVisibility = 0;
            
            for (const section of this.sections) {
                const visibility = this.calculateSectionVisibility(section);
                if (visibility > maxVisibility) {
                    maxVisibility = visibility;
                    activeSection = section;
                }
            }
        }
        
        this.tocLinks.forEach(link => {
            link.classList.remove('active');
            if (activeSection && link.getAttribute('href') === `#${activeSection.id}`) {
                link.classList.add('active');
            }
        });
    }

    calculateSectionVisibility(section) {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const viewportTop = scrollTop;
        const viewportBottom = scrollTop + window.innerHeight;
        
        const sectionTop = section.top;
        const sectionBottom = section.bottom;
        
        const overlapTop = Math.max(viewportTop, sectionTop);
        const overlapBottom = Math.min(viewportBottom, sectionBottom);
        
        if (overlapBottom <= overlapTop) return 0;
        
        const overlapHeight = overlapBottom - overlapTop;
        const sectionHeight = sectionBottom - sectionTop;
        
        return overlapHeight / Math.min(sectionHeight, window.innerHeight);
    }

    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            return;
        }

        const options = {
            root: null,
            rootMargin: '-20% 0px -20% 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    this.highlightTOCItem(id);
                }
            });
        }, options);

        this.sections.forEach(section => {
            observer.observe(section.element);
        });
    }

    highlightTOCItem(sectionId) {
        this.tocLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
    }

    handleTOCClick(event) {
        event.preventDefault();
        
        const link = event.target;
        const href = link.getAttribute('href');
        
        if (href && href.startsWith('#')) {
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offset = 80;
                const targetPosition = targetElement.offsetTop - offset;
                
                if (this.reducedMotion) {
                    window.scrollTo(0, targetPosition);
                } else {
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        }
    }

    setupImageLoading() {
        if (!this.heroImage) return;

        this.heroImage.addEventListener('load', () => {
            if (this.reducedMotion) {
                this.heroImage.classList.add('loaded');
            } else {
                setTimeout(() => {
                    this.heroImage.classList.add('loaded');
                }, 200);
            }
        });

        if (this.heroImage.complete) {
            this.heroImage.classList.add('loaded');
        }
    }

    setupShareButtons() {
        if (this.shareBtn) {
            this.shareBtn.addEventListener('click', this.handleShare.bind(this));
        }
        
        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', this.handleCopy.bind(this));
        }
    }

    async handleShare() {
        const shareData = {
            title: document.title,
            text: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                this.showShareFeedback('Article shared successfully!');
            } else {
                await this.copyToClipboard(shareData.url);
                this.showShareFeedback('Link copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
            this.showShareFeedback('Unable to share article');
        }
    }

    async handleCopy() {
        try {
            await this.copyToClipboard(window.location.href);
            this.showShareFeedback('Link copied to clipboard!');
        } catch (error) {
            console.error('Error copying:', error);
            this.showShareFeedback('Unable to copy link');
        }
    }

    async copyToClipboard(text) {
        if (!navigator.clipboard) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
            } finally {
                document.body.removeChild(textArea);
            }
            return;
        }

        await navigator.clipboard.writeText(text);
    }

    showShareFeedback(message) {
        let feedback = document.getElementById('shareFeedback');
        
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'shareFeedback';
            feedback.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #b71c1c;
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                z-index: 1000;
                opacity: 0;
                transform: translateY(-10px);
                transition: opacity 0.3s ease, transform 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            `;
            document.body.appendChild(feedback);
        }

        feedback.textContent = message;
        
        requestAnimationFrame(() => {
            if (feedback) {
                feedback.style.opacity = '1';
                feedback.style.transform = 'translateY(0)';
            }
        });

        setTimeout(() => {
            if (feedback) {
                feedback.style.opacity = '0';
                feedback.style.transform = 'translateY(-10px)';
            }
        }, 3000);
    }

    refresh() {
        this.calculateSectionPositions();
        this.updateProgress();
        this.updateTOCVisibility();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const editorial = new EditorialPage();
    window.editorial = editorial;
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden
    } else {
        // Page is visible
        if (window.editorial) {
            window.editorial.refresh();
        }
    }
});
