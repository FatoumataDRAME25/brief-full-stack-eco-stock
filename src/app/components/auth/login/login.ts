import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators,ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule,ReactiveFormsModule,],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  constructor() {
    this.form.valueChanges.subscribe(() => {
      this.errorMessage.set(null);
    });
  }

  private loginservice = inject(LoginService)
  private router = inject(Router)
  private fb = inject(FormBuilder)
  errorMessage= signal<string | null>(null);

  form =this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  })

  get username() {return this.form.get('username')}
  get password() {return this.form.get('password')}

  onSubmit(): void{
    this.errorMessage.set(null)
    if(this.form.invalid) {
      return
    }
    this.loginservice.login(this.form.getRawValue()).subscribe({
      next: (data)=>{
        this.router.navigate(['/dashboard'])
      },

      error: (err)=>{
        this.errorMessage.set("Nom d'utilisateur ou mot de passe incorrect.");

      }
    })
  }

}

