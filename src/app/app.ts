import { Component, signal, ElementRef, AfterViewInit, ViewChild, Output, EventEmitter, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import emailjs, { EmailJSResponseStatus } from 'emailjs-com';
import { FormPop } from './form-pop/form-pop';

// interface LoginData {
//   email: string;
//   password: string;
//   rememberMe: boolean;
// }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormField, ReactiveFormsModule, FormPop, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class app {
  protected readonly title = signal('newproject');

  faqs = [
    {
      question: 'Is shoulder surgery safe?',
      answer: 'Yes. Shoulder surgery is generally safe when performed by an experienced orthopedic surgeon after proper evaluation.'
    },
    {
      question: 'Will shoulder surgery be painful?',
      answer: 'Pain is well managed with medications and post-operative care.'
    },
    {
      question: 'How long does recovery take after shoulder surgery?',
      answer: 'Recovery varies depending on the procedure. It may take weeks to months.'
    },
    {
      question: 'Is physiotherapy required after shoulder surgery?',
      answer: 'Yes. Physiotherapy is essential for restoring shoulder strength and movement.'
    },
    {
      question: 'When can I return to work?',
      answer: 'This depends on your job role and recovery progress.'
    },
    {
      question: 'Is surgery always necessary for shoulder pain?',
      answer: 'No. Many shoulder conditions improve with non-surgical treatment. Surgery is advised only when conservative care fails.'
    },
  ];

  activeIndex: number | null = null;

  toggleFAQ(index: number) {
    this.activeIndex = this.activeIndex === index ? null : index;
  }


  @Output() menuState = new EventEmitter<boolean>();

  menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    this.menuState.emit(this.menuOpen); // ✅ send state
  }



  //  smallNumber = 0;
  // bigNumber = 0;
  // hasAnimated = false; // prevent re-triggering

  // ngAfterViewInit() {
  //   const observer = new IntersectionObserver(entries => {
  //     entries.forEach(entry => {
  //       if (entry.isIntersecting && !this.hasAnimated) {
  //         this.hasAnimated = true;
  //         this.startCounters();
  //       }
  //     });
  //   }, { threshold: 0.5 }); // 50% visible

  // observer.observe(this.counterSection.nativeElement);
  // }

  // startCounters() {
  //   this.animateValue('smallNumber', 15, 1500);
  //   this.animateValue('bigNumber', 5000, 2000);
  // }

  // animateValue(property: 'smallNumber' | 'bigNumber', end: number, duration: number) {
  //   const startTime = performance.now();

  //   const animate = (currentTime: number) => {
  //     const progress = Math.min((currentTime - startTime) / duration, 1);
  //     this[property] = Math.floor(progress * end);

  //     if (progress < 1) {
  //       requestAnimationFrame(animate);
  //     }
  //   };

  //   requestAnimationFrame(animate);
  // }


  appointmentForm!: FormGroup
  userAddress: string = '';
  pageName: string = 'S Surgery Page';
  isSubmitting: boolean = false;
  submitted: boolean = false;
  constructor(
    private fb: FormBuilder
  ) { }



  // ngOnInit(): void {
  //   this.initForm();
  //   this.fetchUserLocation();
  // }

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


  // showPopup = false;
  // popupShown = false;

  // @HostListener('window:scroll', [])
  // onWindowScroll() {
  //   if (this.popupShown) return;

  //   const scrollPosition = window.scrollY;
  //   const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
  //   const scrollPercent = (scrollPosition / pageHeight) * 100;

  //   if (scrollPercent > 50) { // show after 50% scroll
  //     this.showPopup = true;
  //     this.popupShown = true;
  //   }
  // }

  // closePopup() {
  //   this.showPopup = false;
  // }

  //   showPopup = false;
  // popupShown = false; // prevents multiple triggers

  // @HostListener('window:scroll', [])
  // onWindowScroll() {
  //   const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

  //   if (scrollPosition > 300 && !this.popupShown) {
  //     this.showPopup = true;
  //     this.popupShown = true;
  //   }
  // }

  // closePopup() {
  //   this.showPopup = false;
  // }


  // 


  //   isVisible = false;
  // popupShown = false;

  // name = '';
  // email = '';

  // @HostListener('window:scroll', [])
  // onWindowScroll() {
  //   const scrollPosition =
  //     window.pageYOffset || document.documentElement.scrollTop;

  //   const pageHeight =
  //     document.documentElement.scrollHeight -
  //     document.documentElement.clientHeight;

  //   const scrollPercentage = (scrollPosition / pageHeight) * 100;

  //   if (scrollPercentage > 40 && !this.popupShown) {
  //     this.isVisible = true;
  //     this.popupShown = true;
  //   }
  // }

  // close() {
  //   this.isVisible = false;
  // }

  // submitForm() {
  //   console.log('Name:', this.name);
  //   console.log('Email:', this.email);
  //   this.close();
  // }


  // showPopup = false;
  // popupShown = false; // to show only once

  // @HostListener('window:scroll', [])
  // onWindowScroll() {

  //   const scrollPosition = window.scrollY;

  //   if (scrollPosition > 300 && !this.popupShown) {
  //     this.showPopup = true;
  //     this.popupShown = true;
  //   }
  // }

  // closePopup() {
  //   this.showPopup = false;
  // }

  //  showPopup = false;
  // popupShown = false;

  // @HostListener('window:scroll', [])
  // onWindowScroll() {

  //   const scrollPosition = window.scrollY;
  //   const screenHeight = window.innerHeight;

  //   // When user reaches second screen
  //   if (scrollPosition >= screenHeight && !this.popupShown) {
  //     this.showPopup = true;
  //     this.popupShown = true;
  //   }
  // }

  @ViewChild('appointmentSection', { static: false })
  appointmentSection!: ElementRef;

  scrollToForm(): void {
    this.appointmentSection.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }


    ngOnInit() {
    const popupClosed = localStorage.getItem('popupClosed');

    if (!popupClosed) {
      setTimeout(() => {
        this.openPopup();
      }, 500); // small delay for smooth UX
    } else {
      this.showFloatingIcon = true;
    }

     this.initForm();
    this.fetchUserLocation();
  }
  
  
    activeFormIndex: number | null = null;
  popupClosed = false;
  popupTriggered = false;
  showFloatingIcon = false;
    showMessageCard = false;
  hideMessageAnimation = false;

  toggleForm(index: number) {
    this.activeIndex = this.activeIndex === index ? null : index;
  }


  isPopupOpen = false;

  openPopup() {
    this.isPopupOpen = true;
    this.showFloatingIcon = false;
  }

 closePopup() {
    this.isPopupOpen = false;
    this.showFloatingIcon = true;

    // show message
    this.showMessageCard = true;
    this.hideMessageAnimation = false;

    // start fade out after 4 sec
    setTimeout(() => {
      this.hideMessageAnimation = true;
    }, 4000);

    // remove element after animation
    setTimeout(() => {
      this.showMessageCard = false;
    }, 5000);

     localStorage.setItem('popupClosed', 'true');
  }

  @ViewChild('triggerSection') triggerSection!: ElementRef;
  

  @HostListener('window:scroll', [])
  onWindowScroll() {

    if (!this.triggerSection || this.popupTriggered || this.popupClosed) return;

    const rect = this.triggerSection.nativeElement.getBoundingClientRect();

    if (rect.bottom <= window.innerHeight) {
      this.openPopup();
      this.popupTriggered = true;
    }
  }


  // @ViewChild('targetSection') targetSection!: ElementRef;
  // showPopup = false;
  // popupShown = false;

  // @HostListener('window:scroll', [])
  // onScroll() {
  //       const sectionTop = this.targetSection.nativeElement.getBoundingClientRect().top;
  //   const windowHeight = window.innerHeight;

  //   if (sectionTop < windowHeight) {
  //     this.showPopup = true;
  //     this.popupShown =true;
  //   }
  // }

  // positonOfPopup({/

  // })

  // @HostListener('window:scroll', [])
  // onScroll() {
  //   if (window.scrollY > 400) {
  //     this.showPopup = true;
  //   }
  // }

  // @ViewChild('section3') section3!: ElementRef;
  // showPopup = false;
  // popupShown = false; // so it shows only once

  // @HostListener('window:scroll', [])
  // onScroll() {

  //   if (!this.popupShown) {

  //     const sectionPosition =
  //       this.section3.nativeElement.getBoundingClientRect().top;

  //     if (sectionPosition <= window.innerHeight) {
  //       this.showPopup = true;
  //       this.popupShown = true;
  //     }
  //   }
  // }

  //   showPopup = false;
  // popupShown = false;

  // @HostListener('window:scroll', [])
  // onScroll() {
  //   if (window.scrollY > 400 && !this.popupShown) {
  //     this.showPopup = true;
  //     this.popupShown = true;
  //   }

  // console.log();
  // }

  // closePopup() {
  //   this.showPopup = false;
  // }
}

