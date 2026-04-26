document.addEventListener('DOMContentLoaded', () => {
    const cursor = document.getElementById('cursor-glow');
    if (!cursor) return;

    console.log("Flowdesk Interactive Cursor Active");

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animate() {
        
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;

        cursor.style.left = currentX + 'px';
        cursor.style.top = currentY + 'px';

        requestAnimationFrame(animate);
    }

    animate();

    
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, .btn, .hero-container, .feature-card')) {
            cursor.classList.add('hovering');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('a, button, .btn, .hero-container, .feature-card')) {
            cursor.classList.remove('hovering');
        }
    });
});
