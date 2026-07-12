import { HttpInterceptorFn } from "@angular/common/http";
import { LoginService } from "../services/login.service";
import { inject } from "@angular/core";

export const jwtInterceptor : HttpInterceptorFn = (req, next) =>{
  const loginService = inject(LoginService)
  const token = loginService.getAccessToken()

  const clonedreq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  })
  if (token){
    return next(clonedreq)
  } else{
    return next(req)
  }
}
