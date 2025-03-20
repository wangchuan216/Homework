class DataVisual extends HTMLElement {
    constructor() {
      super();
      this.type = this.getAttribute("type") || "line";
      this.data = JSON.parse(this.getAttribute("data")) || [];
      this.options = JSON.parse(this.getAttribute("options")) || {};
      this.chart = null;
      this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      this.shadowRoot.innerHTML = `<canvas></canvas>`;
      this.renderChart();
    }
    renderChart() {
      const ctx = this.shadowRoot.querySelector("canvas").getContext("2d");
      this.chart = new Chart(ctx, {
        type: this.type,
        data: {
          labels: this.data.map((_, i) => `Point ${i+1}`),
          datasets: [{
            label: this.getAttribute("label") || "Dataset",
            data: this.data,
            backgroundColor: this.options.backgroundColor || "rgba(0, 123, 255, 0.5)",
            borderColor: this.options.borderColor || "rgba(0, 123, 255, 1)",
            borderWidth: this.options.borderWidth || 2,
            hoverBackgroundColor: this.options.hoverBackgroundColor || "rgba(0, 123, 255, 0.8)",
            hoverBorderColor: this.options.hoverBorderColor || "rgba(0, 123, 255, 1.2)"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          legend: { display: this.options.legend !== false }
        }
      });
    }
    setData(newData) {
      this.data = newData;
      if (this.chart) {
        this.chart.data.datasets[0].data = newData;
        this.chart.update();
      }
    }
  }
  
  customElements.define("data-visual", DataVisual);
  