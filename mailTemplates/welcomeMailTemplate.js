module.exports = ({ email, name }) => {
  return {
    to: email,
    subject: "Welcome to YFTChain",
    html() {
      return `
<table class="spacer" style="
   border-collapse: collapse;
   border-spacing: 0;
   padding: 0;
   vertical-align: top;
   width: 100%;
   ">
   <tbody>
      <tr style="padding: 0; vertical-align: top">
         <td height="20" style="
            -moz-hyphens: auto;
            -webkit-hyphens: auto;
            border-collapse: collapse !important;
            hyphens: auto;
            line-height: 20px;
            margin: 0;
            mso-line-height-rule: exactly;
            padding: 0;
            vertical-align: top;
            word-wrap: break-word;
            "></td>
      </tr>
   </tbody>
</table>
<table width="100%" style="
   border-collapse: collapse;
   border-spacing: 0;
   padding: 0;
   vertical-align: top;
   ">
   <tbody>
      <tr style="padding: 0; vertical-align: top">
         <th style="
            color: #626262;
            line-height: 1.3;
            margin: 0;
            padding: 0;
            ">
            <h2 class="text-center" style="
               color: #626262;
               font-family: 'Paytone One',
               'Montserrat ', sans-serif;
               font-size: 30px;
               font-weight: 700;
               line-height: 1.3;
               margin: auto;
               padding: 0;
               text-align: center;
               width: 90%;
               word-wrap: normal;
               ">
               Dear ${name}
            </h2>
         </th>
      </tr>
   </tbody>
</table>
<table class="spacer" style="
   border-collapse: collapse;
   border-spacing: 0;
   padding: 0;
   vertical-align: top;
   width: 100%;
   ">
   <tbody>
      <tr style="padding: 0; vertical-align: top">
         <td height="20" style="
            -moz-hyphens: auto;
            -webkit-hyphens: auto;
            border-collapse: collapse !important;
            color: #626262;
            hyphens: auto;
            margin: 0;
            mso-line-height-rule: exactly;
            padding: 0;
            vertical-align: top;
            word-wrap: break-word;
            "></td>
      </tr>
   </tbody>
</table>
<table width="100%" style="
   border-collapse: collapse;
   border-spacing: 0;
   padding: 0;
   vertical-align: top;
   ">
   <tbody>
      <tr style="padding: 0; vertical-align: top">
         <th style="margin: 0; padding: 0">
            <p class="text-center" style="
               color: #626262;
               font-family: Montserrat, sans-serif;
               font-size: 14px;
               font-weight: 300;
               line-height: 1.3;
               margin: auto;
               margin-bottom: 0px;
               padding: 0;
               text-align: center;
               width: 95%;
               ">
              Welcome to YFT, and congratulations on successfully creating your account! We're thrilled to have you join our community of passionate football players, clubs, and academies dedicated to developing talent and enhancing the game.
              With your new YFT account, you can now:</br>

            </p>
         </th>
      </tr>
   </tbody>
</table>
<table class="spacer" style="
   border-collapse: collapse;
   border-spacing: 0;
   padding: 0;
   vertical-align: top;
   width: 100%;
   ">
   <tbody>
      <tr style="padding: 0; vertical-align: top">
         <td height="10" style="
            -moz-hyphens: auto;
            -webkit-hyphens: auto;
            border-collapse: collapse !important;
            hyphens: auto;
            margin: 0;
            mso-line-height-rule: exactly;
            padding: 0;
            vertical-align: top;
            word-wrap: break-word;
            "></td>
      </tr>
   </tbody>
</table>
<table width="100%" style="
   border-collapse: collapse;
   border-spacing: 0;

   vertical-align: top;
   ">
   <tbody>
      <tr style=" vertical-align: top">
         <th>
            <div class="" style="
               color: #626262;
               font-family: Montserrat, sans-serif;
               font-size: 14px;
               font-weight: 300;
               line-height: 1.3;
               width: 100%;
               text-align: left;
               ">
         
 <ul style="list-style-position: inside; padding-left: 0;">
                  <li><b>Track your development:</b> Access your personal profile, performance reports, and progress charts.</li>
                  <li><b>Connect with clubs and academies:</b> Stay connected with top football institutions to explore new opportunities.</li>
                  <li><b>Stay up-to-date:</b> Watch match highlights, explore upcoming tournaments, and follow the latest in football.</li>
                  <li><b>Access coaching insights:</b> Get valuable insights from professionals to improve your game.</li>
                  <li><b>Stream matches and events:</b> Be part of the action with live streams, replays, and more.</li>
               </ul>
      
            </div>
         </th>
      </tr>
   </tbody>
</table>
<table width="100%" style="
   border-collapse: collapse;
   border-spacing: 0;
   padding: 0;
   vertical-align: top;
   ">
   <tbody>
      <tr style="padding: 0; vertical-align: top">
         <th style="margin: 0; padding: 0">
            <p class="text-center" style="
               color: #626262;
               font-family: Montserrat, sans-serif;
               font-size: 14px;
               font-weight: 300;
               line-height: 1.3;
               margin: auto;
               margin-bottom: 0px;
               padding: 0;
               text-align: center;
               width: 95%;
               ">
             If you have any questions or need assistance, feel free to reach out to our support team at [Support Email].<br>
We look forward to seeing you grow and achieve great things in the world of football with YFT!

            </p>
         </th>
      </tr>
   </tbody>
</table>
            `;
    },
    text: `Welcome to YFTChain.`,
  };
};
