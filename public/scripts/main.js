// WHATSAPP GROUP LINKS
const whatsappLinks = {
    "Web Designing": "https://chat.whatsapp.com/LZ1lQssn6ESAn0AZEt96y1?mode=gi_t",
    "Quiz": "https://chat.whatsapp.com/HIbP6amrrdPFMR0IIwWFaP?mode=gi_t",
    "Coding and Debugging": "https://chat.whatsapp.com/FDQ7K9kURwmJ1sQNC1Tu2d?mode=gi_t",
    "Hackathon": "https://chat.whatsapp.com/FBcqKbKLZbRF4pLSYMU2Ll",
    "Debate": "https://chat.whatsapp.com/Cmqm4KN6QfDEgIMxuo2QxM?mode=gi_t",
    "Elocution": "https://chat.whatsapp.com/G0vAEU0bBOFEcJZvC8g2aC?mode=gi_t",
    "Mock Interview": "https://chat.whatsapp.com/CI6Dbx0Jfm1I4yRtA6iPM7?mode=gi_t",
    "Free Fire": "https://chat.whatsapp.com/Fmej1iqXnYjDoUN6Yehcnq?mode=gi_t",
    "BGMI": "https://chat.whatsapp.com/EvlzqLEdoHJ8w6OvJyCOKB?mode=gi_t",
    "Startup Pitch": "https://chat.whatsapp.com/HgX5Kw7K2DyDdqYUVnDt4I?mode=gi_t",
    "Short Film Making": "https://chat.whatsapp.com/Dy1aPQGeMHI07htAhH7j6Q?mode=gi_t",
    "Prompt War": "https://chat.whatsapp.com/Gt957EMAACj13l1Xo3YeLv?mode=gi_t"
};



// REGISTRATION FORM UI RENDERING
document.addEventListener('DOMContentLoaded', function () {
    const eventSelect = document.getElementById('eventName');
    const container = document.getElementById('dynamic-fields-container');

    if (!eventSelect || !container) return;

    function getFee(memberCount) {
        if (memberCount === 1) return 49;
        if (memberCount === 2) return 99;
        if (memberCount === 3) return 149;
        if (memberCount >= 4) return 199;
    }

    eventSelect.addEventListener('change', function () {
        const selectedOption = this.options[this.selectedIndex];
        const memberCount = parseInt(selectedOption.getAttribute('data-members'));

        if (!memberCount || isNaN(memberCount)) {
            container.innerHTML = '';
            return;
        }

        let html = '';

        // Team Name
        if (memberCount > 1) {
            html += `<input type="text" name="teamName" placeholder="Team name" required>`;
        }

        // Member Fields
        for (let i = 1; i <= memberCount; i++) {
            const leaderTag = (i === 1 && memberCount > 1) ? ' ( Leader )' : '';
            html += `<input type="text" name="members[]" placeholder="Member ${i}${leaderTag}" required>`;
        }

        // Registration Fee
        const fee = getFee(memberCount);
        html += `
            <input type="email" placeholder="Email" name="email" required>
            <input type="tel" placeholder="Phone number" name="phoneNo" maxlength="10" pattern="[0-9]{10}" inputmode="numeric" required>
        
            <label>Registration Fee</label>
            <input type="text" name="registrationFee" value="₹${fee}" readonly>
        `;

        container.innerHTML = html;
    });
});



// REGISTRATION FORM
const form = document.getElementById('registrationForm');
const modal = document.getElementById('successModal');
const whatsappBtn = document.querySelector('.whatsapp-btn');
const eventSelect = document.getElementById('eventName');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBg = submitBtn.style.backgroundColor; // Store original color
        submitBtn.style.backgroundColor = 'red';
        submitBtn.style.color = '#fff';
        submitBtn.disabled = true;
        submitBtn.innerText = "REGISTERING...";

        const selectedEvent = eventSelect.value;
        const targetLink = whatsappLinks[selectedEvent];

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        data['members'] = formData.getAll('members[]');
        delete data['members[]'];

        // console.log(data);

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                whatsappBtn.href = targetLink;
                modal.style.display = 'flex';
                form.reset();
                const container = document.getElementById('dynamic-fields-container');
                if (container) container.innerHTML = '';
            } else {
                alert(`INTERNAL SERVER ERROR !\n${result.message || 'SUBMITION FAILED !'}`);
            }
        } catch (error) {
            console.error("Network Error:", error);
            alert(`INTERNAL SERVER ERROR !\n${error.message}`);

        } finally {
            submitBtn.disabled = false;
            submitBtn.style.backgroundColor = originalBg;
            submitBtn.innerText = "REGISTER";
        }
    });
}


// Function to close
function closeModal() {
    if (modal) modal.style.display = 'none';
}



// VOLUNTEER LOGIN FORM
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                alert('Login Successful!');
                window.location.href = '/';
            } else {
                alert(`Error: ${result.message || 'Login failed'}`);
            }
        } catch (error) {
            console.error("Network Error:", error);
            alert('An error occurred during login. Please try again.');
        }
    });
}