import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import emailjs, { EmailJSResponseStatus } from 'emailjs-com';


@Component({
  selector: 'app-form-pop',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './form-pop.html',
  styleUrl: './form-pop.css',
})
export class FormPop {

    appointmentForm!: FormGroup
  userAddress: string = '';
  pageName: string = 'S Surgery Page';
  isSubmitting: boolean = false;
  submitted: boolean = false;
  constructor(
    private fb: FormBuilder
  ) {}



  ngOnInit(): void {
    this.initForm();
    this.fetchUserLocation();
  }

  initForm(): void {
    this.appointmentForm = this.fb.group({
      patient_name: ['', [Validators.required, Validators.minLength(2)]],
      mobile_number: ['', [
        Validators.required,
        Validators.pattern(/^[6-9]\d{9}$/)
      ]]
    });
  }

  get f() {
    return this.appointmentForm.controls;
  }

  fetchUserLocation(): void {
    if (!navigator.geolocation) {
      console.warn('❌ Geolocation is not supported by your browser.');
      this.userAddress = 'Location unavailable';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        console.log('📍 Coordinates:', latitude, longitude, 'Accuracy (m):', accuracy);

        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
        )
          .then((res) => res.json())
          .then((data) => {
            const addr = data.address || {};
            const area =
              addr.suburb ||
              addr.village ||
              addr.hamlet ||
              addr.neighbourhood ||
              addr.locality ||
              '';
            const city = addr.city || addr.town || addr.municipality || addr.county || '';
            const state = addr.state || '';
            const country = addr.country || '';
            const postal = addr.postcode || '';

            this.userAddress = `${area ? area + ', ' : ''}${city ? city + ', ' : ''}${state ? state + ', ' : ''
              }${country}${postal ? ' - ' + postal : ''}`;

            console.log('Precise Address:', this.userAddress);
          })
          .catch((err) => {
            console.error('⚠️ Reverse geocoding failed:', err);
            this.userAddress = `Lat: ${latitude}, Lng: ${longitude}`;
          });
      },
      (err) => {
        console.warn('⚠️ Location error:', err);

        if (err.code === err.PERMISSION_DENIED) {
          console.log('🔁 Fallback: Using IP-based location...');
          this.fetchSecondaryLocation();
        } else {
          switch (err.code) {
            case err.POSITION_UNAVAILABLE:
              console.log('Location unavailable. Trying alternate detection...');
              break;
            case err.TIMEOUT:
              console.log('Location request timed out. Trying alternate detection...');
              break;
            default:
              console.log('Unable to fetch location. Trying alternate detection...');
          }
          this.fetchSecondaryLocation();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }

  fetchSecondaryLocation(): void {
    fetch('https://ipapi.co/json/')
      .then((res) => res.json())
      .then((data) => {
        this.userAddress = `${data.city || ''}, ${data.region || ''}, ${data.country_name || ''}`;
        console.log('IP-based location:', this.userAddress);
      })
      .catch((err) => {
        console.error('Secondary location fetch failed:', err);
        this.userAddress = 'Location unavailable';
      });
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.appointmentForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    const templateParams = {
      patient_name: this.appointmentForm.value.patient_name,
      mobile_number: this.appointmentForm.value.mobile_number,
      location: this.userAddress || 'Location not available',
      page_name: this.pageName,
      domain_name: 'shoulderreplacementsurgery.in'
    };

    emailjs.send(
      'service_b8jvt4d',
      'template_rhr950l',
      templateParams,
      'TTEfFnQUvu6htAOxZ'
    )
      .then(
        (response) => {
          console.log('✅ Email sent successfully!', response.status, response.text);
          alert('Appointment booked successfully! We will contact you soon.');
          this.appointmentForm.reset();
          this.submitted = false;
        },
        (error) => {
          console.error('❌ Email sending failed:', error);
          alert('Failed to book appointment. Please try again.');
        }
      )
      .finally(() => {
        this.isSubmitting = false;
      });
  }

}
