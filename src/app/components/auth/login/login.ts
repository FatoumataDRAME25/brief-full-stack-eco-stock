import { Component, inject } from '@angular/core';
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

  private loginservice = inject(LoginService)
  private router = inject(Router)
  private fb = inject(FormBuilder)

  form =this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  })

  onSubmit(): void{
    this.loginservice.login(this.form.getRawValue()).subscribe({
      next: (data)=>{
        this.router.navigate(['/dashboard'])
      },

      error: (err)=>{
        console.log(err);

      }
    })
  }

}

