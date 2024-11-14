import React from 'react';
import { Card } from 'reactstrap';

export const Home = () => {
  return (
    <div className="homepage">

        <div className="centered-text">
            <h3>Qmath</h3>
            <h4>Ett modernt studiealternativ</h4>
        </div>
      <div className="main-banner">
        <div className="text-section">
          <h1>Studieteknik som är gjord <span className='QmathGradientText'>specifikt för dig</span></h1>
          <button className="cta-button">Börja plugg</button>
          <p className="description">
            Inget är trivialt! <a href="#steps">steg-för-steg förklaring</a><br />
            Anpassade frågor efter ditt kunskapsnivå<br />
            Statistik som visar <a href="#stats">vad du behöver bli bättre på</a>
          </p>
        </div>
        <div className="media-section">
          <div className="media-placeholder">GIF/VIDEO</div>
        </div>
      </div>

      <Card className="payCard">
          <Card style={{width:"30%" ,height: "80%"}}>Basic Free</Card>
          <Card className="QmathGradientBackground" style={{width:"40%" ,height: "100%"}}>Student</Card>
          <Card style={{width:"30%" ,height: "80%"}}>Paid</Card>
      </Card>

      <div className="learn-more">
        <h2>Lär känna Qmath</h2>
        <a href="#read-more" className="read-more">Läs mer om här</a>
      </div>
      <style>
        {`
            .QmathGradientBackground {
              background: linear-gradient(to right, DarkSlateBlue, DarkViolet);
            }
            .QmathGradientText {
              color: linear-gradient(to right, DarkSlateBlue, DarkViolet);
            }
            .payCard{
              background: grey;
              display: flex;
              justify-content: space-around;
              padding: 20px;
              flex-direction: row;
              width:80%;
              height:20vw;
            }
            .centered-text {
                text-align: center; 
                margin: 0 auto; 
            }
            body {
                margin: 0;
                font-family: 'Arial', sans-serif;
                background-color: #f8f8f8;
            }

            .homepage {
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .header {
                width: 100%;
                background-color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 50px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .main-banner {
                display: flex;
                justify-content: space-between;
                background-color: white;
                padding: 50px;
                margin: 30px 0;
                width: 80%;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }

            .text-section {
                display: flex;
                flex-direction: column;
                justify-content: center;
            }

            .text-section h1 {
                font-size: 36px;
                color: #333;
            }

            .text-section span {
                color: #6e45e2;
                font-weight: bold;
            }

            .cta-button {
                margin-top: 20px;
                padding: 10px 20px;
                background-color: #6e45e2;
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                cursor: pointer;
            }

            .description {
                margin-top: 10px;
                color: #888;
                font-size: 14px;
            }

            .description a {
                color: #6e45e2;
                text-decoration: none;
            }

            .media-section {
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .media-placeholder {
                width: 300px;
                height: 200px;
                background-color: #ddd;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 18px;
                color: #555;
            }

            .learn-more {
                margin-top: 30px;
                text-align: center;
            }

            .learn-more h2 {
                color: #333;
            }

            .read-more {
                color: #6e45e2;
                text-decoration: none;
            }

        `}
      </style>
    </div>
  );
};