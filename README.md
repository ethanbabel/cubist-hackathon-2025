## Modeling Toll Pricing for Congestion Management

**Objective**

The goal of the congestion model is to determine optimal congestion tolls for each entry point into the Manhattan Central Business District that are dynamically adjusted, both:
    - Locally: at the specific entry point, and
    - Globally: across the entire Central Residential Zone (CRZ)

The model is designed to set the lowest tolls possible while maintaining congestion below a defined threshold (e.g., 0.3). This ensures traffic flow and accessibility without unnecessarily overpricing entry.

**What Is the Congestion Score?**
Congestion score is defined as follows:
\begin{center}
    hello
\end{center}
	•	0.0 = completely free-flowing traffic
	•	1.0 = total gridlock

These scores are pulled from real-time traffic APIs (TomTom) and represent average delay and speed at specified GPS coordinates. Global congestion is measured as the average of sampled CRZ locations. Local congestion is computed per-entry-point by averaging scores around each entry’s geofence.