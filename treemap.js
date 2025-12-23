// Create treemap visualization
function createTreemap(data, selector) {
    // Clear existing
    d3.select(selector).selectAll('*').remove();
    
    const container = document.querySelector(selector);
    const width = container.clientWidth;
    const height = 400;
    
    // Create SVG
    const svg = d3.select(selector)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('font-family', 'inherit');
    
    // Create hierarchy
    const root = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);
    
    // Create treemap layout
    d3.treemap()
        .size([width, height])
        .padding(2)
        .round(true)
        (root);
    
    // Create cells
    const cell = svg.selectAll('g')
        .data(root.leaves())
        .join('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);
    
    // Add rectangles
    cell.append('rect')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => d.data.color)
        .attr('opacity', d => currentFilter === d.data.category ? 1 : 0.8) // Highlight if selected
        .attr('rx', 6)
        .attr('stroke', d => currentFilter === d.data.category ? '#4F46E5' : 'none') // Border if selected
        .attr('stroke-width', d => currentFilter === d.data.category ? 3 : 0)
        .style('cursor', 'pointer')
        .on('mouseover', function() {
            d3.select(this).attr('opacity', 1);
        })
        .on('mouseout', function(event, d) {
            const isSelected = currentFilter === d.data.category;
            d3.select(this).attr('opacity', isSelected ? 1 : 0.8);
        })
        .on('click', function(event, d) {
            // Toggle filter - if clicking same category, clear it
            if (currentFilter === d.data.category) {
                clearAllFilters();
            } else {
                filterByCategory(d.data.category);
            }
        });
    
    // Add text labels
    cell.append('text')
        .attr('x', 4)
        .attr('y', 20)
        .attr('fill', 'white')
        .style('font-weight', '600')
        .style('font-size', '14px')
        .style('pointer-events', 'none')
        .text(d => {
            const width = d.x1 - d.x0;
            return width > 80 ? d.data.name : '';
        });
    
    // Add amount labels
    cell.append('text')
        .attr('x', 4)
        .attr('y', 38)
        .attr('fill', 'white')
        .style('font-size', '12px')
        .style('opacity', 0.9)
        .style('pointer-events', 'none')
        .text(d => {
            const width = d.x1 - d.x0;
            return width > 80 ? `$${d.data.value.toFixed(2)}` : '';
        });
    
    // Add count labels
    cell.append('text')
        .attr('x', 4)
        .attr('y', 52)
        .attr('fill', 'white')
        .style('font-size', '11px')
        .style('opacity', 0.8)
        .style('pointer-events', 'none')
        .text(d => {
            const width = d.x1 - d.x0;
            const height = d.y1 - d.y0;
            return (width > 80 && height > 60) ? `${d.data.count} items` : '';
        });
}

// Responsive resize
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (currentView === 'treemap') {
            renderTreemap();
        }
    }, 250);
});
