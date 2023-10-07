
class InteractiveGraph {
    
    constructor(doc, id, treeData, state) {
        this.nodeTypes = {"problem": 8, "trouble": 6, "shot": 4}
        
        this.root = treeData[0];
        this.root.x0 = 0;
        this.root.y0 = 0;
        
        let lw = [1];
        this.childCount(0, this.root, lw);
        let newHeight = d3.max(lw) * 25;
        
        let margin = {top: 10, right: 0, bottom: 0, left: 20}
        let width = 460 - margin.right - margin.left
        let height = 400 - margin.top - margin.bottom
            
        this.uniqId = 0
        this.duration = 300
        
        this.tree = d3.layout.tree().size([newHeight*1.5, width])
        
        this.diagonal = d3.svg.diagonal().projection(d => [d.y, d.x]);
        
        this.svg = d3.select("#" + id).append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", newHeight*2 + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        this.tree.separation((a, b) => 10);
    }
    
    update(source) {
        // Compute the new tree layout.
        let nodes = this.tree.nodes(this.root).reverse()
        let links = this.tree.links(nodes)
        
        // Normalize for fixed-depth.
        nodes.forEach(d => d.y = d.depth * 40);
        
        // Stash the old positions for transition.
        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
        
        // Update the nodes…
        let node = this.svg.selectAll("g.node").data(nodes, d => d.id || (d.id = ++this.uniqId));
        // Update the links…
        var link = this.svg.selectAll("path.link").data(links, d => d.target.id);
        
        // Enter any new nodes at the parent's previous position.
        let nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", d => "translate(" + source.y0 + "," + source.x0 + ")")
            .on("click", d => console.log("show current"))
            .on("dblclick", d => {
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else {
                    d.children = d._children;
                    d._children = null;
                }
                this.update(d);
            });
        
        nodeEnter.append("circle")
              .attr("r", 1e-6)
              .style("fill", d => d._children ? "lightsteelblue" : "var(--bg-color)");
        
        nodeEnter.append("text")
            .attr("x", d => (d.children || d._children ? 5 : -5))
            .attr("y", d => -this.nodeTypes[d.type] - 4)
            .attr("text-anchor", d => d.children || d._children ? "end" : "start")
            .text(d => d.name)
            .style("fill-opacity", 1e-6);
        
        // Transition nodes to their new position.
        let nodeUpdate = node.transition()
              .duration(this.duration)
              .attr("transform", d => "translate(" + d.y + "," + d.x + ")");
        
        nodeUpdate.select("circle")
              .attr("r", d => this.nodeTypes[d.type] )
              .style("fill", d => d._children ? "lightsteelblue" : "var(--bg-color)");
        
        nodeUpdate.select("text")
              .style("fill-opacity", 1);
        
        // Transition exiting nodes to the parent's new position.
        let nodeExit = node.exit().transition()
              .duration(this.duration)
              .attr("transform", d => "translate(" + source.y + "," + source.x + ")")
              .remove();
        
        nodeExit.select("circle").attr("r", 1e-6);
        nodeExit.select("text").style("fill-opacity", 1e-6);
        
        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", d => {
                let o = {x: source.x0, y: source.y0};
                return this.diagonal({source: o, target: o});
            });
        
        // Transition links to their new position.
        link.transition().duration(this.duration)
              .attr("d", this.diagonal);
        
        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(this.duration)
            .attr("d", d => {
                let o = {x: source.x, y: source.y};
                return this.diagonal({source: o, target: o});
            })
            .remove();
    }
    
    childCount(level, n, levelWidth) {
        if(n.children && n.children.length > 0) {
            if(levelWidth.length <= level + 1) levelWidth.push(0);
            levelWidth[level+1] += n.children.length;
            n.children.forEach(d => this.childCount(level + 1, d, levelWidth));
        }
    }
    
    draw() {
        this.update(this.root); 
    }
}