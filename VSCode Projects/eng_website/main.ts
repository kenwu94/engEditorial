// TypeScript implementation for editorial page interactions
// ES2020+ compatible, strongly typed with error handling

interface ScrollPosition {
    x: number;
    y: number;
}

interface SectionPosition {
    id: string;
    top: number;
    bottom: number;
    element: HTMLElement;
}

interface ShareData {
    title: string;
    text: string;
    url: string;
}

class EditorialPage {
    private masthead: HTMLElement | null;
    private progressBar: HTMLElement | null;
    private toc: HTMLElement | null;
    private tocLinks: NodeListOf<HTMLAnchorElement>;
    private sections: SectionPosition[];
    private shareBtn: HTMLElement | null;
    private copyBtn: HTMLElement | null;
    private heroImage: HTMLImageElement | null;
    private lastScrollY: number;
    private ticking: boolean;
    private reducedMotion: boolean;

    constructor() {
        // Initialize DOM elements
        this.masthead = document.getElementById('masthead');
        this.progressBar = document.getElementById('progressBar');
        this.toc = document.getElementById('toc');
        this.tocLinks = document.querySelectorAll('.toc-list a');
        this.shareBtn = document.getElementById('shareBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.heroImage = document.querySelector('.hero-image');
        
        // Initialize state
        this.lastScrollY = window.scrollY;
        this.ticking = false;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.sections = [];
        
        this.init();
    }

    private init(): void {
        this.setupEventListeners();
        this.calculateSectionPositions();
        this.setupImageLoading();
        this.setupShareButtons();
        
        // Initial calculations
        this.updateProgress();
        this.updateTOCVisibility();
        
        // Show TOC after a short delay
        setTimeout(() => {
            if (this.toc) {
                this.toc.classList.add('visible');
            }
        }, 500);
    }

    private setupEventListeners(): void {
        // Scroll event with requestAnimationFrame for performance
        window.addEventListener('scroll', this.handleScroll.bind(this), {
            passive: true
        });

        // Resize event for recalculating positions
        window.addEventListener('resize', this.handleResize.bind(this), {
            passive: true
        });

        // TOC link clicks
        this.tocLinks.forEach(link => {
            link.addEventListener('click', this.handleTOCClick.bind(this));
        });

        // Intersection Observer for section highlighting
        this.setupIntersectionObserver();
    }

    private handleScroll(): void {
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

    private handleResize(): void {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = window.setTimeout(() => {
            this.calculateSectionPositions();
            this.updateProgress();
            this.updateTOCVisibility();
        }, 250);
    }

    private resizeTimeout: number = 0;

    private calculateSectionPositions(): void {
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

    private updateProgress(): void {
        if (!this.progressBar) return;

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = Math.min((scrollTop / scrollHeight) * 100, 100);
        
        this.progressBar.style.width = `${progress}%`;
        this.progressBar.setAttribute('aria-valuenow', progress.toString());
    }

    private updateMasthead(): void {
        if (!this.masthead) return;

        const scrollThreshold = 100;
        const isCompact = window.scrollY > scrollThreshold;
        
        if (isCompact && !this.masthead.classList.contains('compact')) {
            this.masthead.classList.add('compact');
        } else if (!isCompact && this.masthead.classList.contains('compact')) {
            this.masthead.classList.remove('compact');
        }
    }

    private updateTOCVisibility(): void {
        if (!this.toc) return;

        const scrollThreshold = 200;
        const shouldShow = window.scrollY > scrollThreshold;
        
        if (shouldShow && !this.toc.classList.contains('visible')) {
            this.toc.classList.add('visible');
        }
    }

    private updateActiveSection(): void {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const viewportCenter = scrollTop + (window.innerHeight / 2);
        
        let activeSection: SectionPosition | null = null;
        
        // Find the section closest to the viewport center
        for (const section of this.sections) {
            if (viewportCenter >= section.top && viewportCenter <= section.bottom) {
                activeSection = section;
                break;
            }
        }
        
        // If no section is in the center, find the one that's most visible
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
        
        // Update TOC active states
        this.tocLinks.forEach(link => {
            link.classList.remove('active');
            if (activeSection && link.getAttribute('href') === `#${activeSection.id}`) {
                link.classList.add('active');
            }
        });
    }

    private calculateSectionVisibility(section: SectionPosition): number {
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

    private setupIntersectionObserver(): void {
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers
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

        // Observe all sections
        this.sections.forEach(section => {
            observer.observe(section.element);
        });
    }

    private highlightTOCItem(sectionId: string): void {
        this.tocLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
    }

    private handleTOCClick(event: Event): void {
        event.preventDefault();
        
        const link = event.target as HTMLAnchorElement;
        const href = link.getAttribute('href');
        
        if (href && href.startsWith('#')) {
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offset = 80; // Account for sticky header
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

    private setupImageLoading(): void {
        if (!this.heroImage) return;

        // Add loading animation
        this.heroImage.addEventListener('load', () => {
            if (this.reducedMotion) {
                this.heroImage?.classList.add('loaded');
            } else {
                // Stagger the animation for better visual effect
                setTimeout(() => {
                    this.heroImage?.classList.add('loaded');
                }, 200);
            }
        });

        // Handle images that are already cached
        if (this.heroImage.complete) {
            this.heroImage.classList.add('loaded');
        }
    }

    private setupShareButtons(): void {
        if (this.shareBtn) {
            this.shareBtn.addEventListener('click', this.handleShare.bind(this));
        }
        
        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', this.handleCopy.bind(this));
        }
    }

    private async handleShare(): Promise<void> {
        const shareData: ShareData = {
            title: document.title,
            text: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                this.showShareFeedback('Article shared successfully!');
            } else {
                // Fallback to copy if Web Share API is not available
                await this.copyToClipboard(shareData.url);
                this.showShareFeedback('Link copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
            this.showShareFeedback('Unable to share article');
        }
    }

    private async handleCopy(): Promise<void> {
        try {
            await this.copyToClipboard(window.location.href);
            this.showShareFeedback('Link copied to clipboard!');
        } catch (error) {
            console.error('Error copying:', error);
            this.showShareFeedback('Unable to copy link');
        }
    }

    private async copyToClipboard(text: string): Promise<void> {
        if (!navigator.clipboard) {
            // Fallback for older browsers
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

    private showShareFeedback(message: string): void {
        // Create or update feedback element
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
        
        // Show feedback
        requestAnimationFrame(() => {
            if (feedback) {
                feedback.style.opacity = '1';
                feedback.style.transform = 'translateY(0)';
            }
        });

        // Hide feedback after 3 seconds
        setTimeout(() => {
            if (feedback) {
                feedback.style.opacity = '0';
                feedback.style.transform = 'translateY(-10px)';
            }
        }, 3000);
    }

    // Public method to manually refresh calculations
    public refresh(): void {
        this.calculateSectionPositions();
        this.updateProgress();
        this.updateTOCVisibility();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const editorial = new EditorialPage();
    
    // Make it available globally for debugging
    (window as any).editorial = editorial;
});

// Handle page visibility changes to pause/resume animations
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, could pause expensive operations
    } else {
        // Page is visible, resume operations
        if ((window as any).editorial) {
            (window as any).editorial.refresh();
        }
    }
});

// Export for module systems
export default EditorialPage;